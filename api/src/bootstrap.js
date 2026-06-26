// dotenv must be the first import so all subsequent modules read env vars correctly.
// In ESM, import statements are hoisted — using the side-effect form ensures
// process.env is populated before any other module initialises.
import 'dotenv/config';

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createHttpOrHttpsServer, detectProtocol } from './config/httpServer.js';
import { setupSocket } from './sockets/io.js';
import { registerCoreMiddleware } from './middleware/index.js';
import { registerRoutes } from './routes/index.js';
import { registerErrorHandlers } from './errors/index.js';
import { startNotificationScheduler } from './utils/scheduler.js';
import { startEmailIngestScheduler } from './utils/emailIngest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Server configuration ──────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Bind to all interfaces in production (required for containers/load balancers).
// Bind to localhost only in development to avoid accidental network exposure.
const HOST = process.env.NODE_ENV === 'production'
  ? '0.0.0.0'
  : (process.env.HOST ?? 'localhost');

// Allow the uploads directory to be overridden per deployment.
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(__dirname, '../uploads');

// ── Graceful shutdown ─────────────────────────────────────────────────────────

function shutdown(server, signal) {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10 s if in-flight requests haven't finished
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function startServer() {
  const app    = express();
  const server = createHttpOrHttpsServer(app);

  // ── Startup config log ────────────────────────────────────────────────────
  // Printed before any request is handled so it appears at the top of IIS /
  // hosting logs. Shows the actual values the server resolved from its
  // environment (web.config, hosting dashboard, .env, or defaults).
  console.log('─────────────────────────────────────────');
  console.log('  Server configuration');
  console.log('─────────────────────────────────────────');
  console.log(`  NODE_ENV                  : ${process.env.NODE_ENV ?? '(not set) → development'}`);
  console.log(`  PORT                      : ${process.env.PORT ?? '(not set) → 3000'}`);
  console.log(`  ACCESS_TOKEN_EXPIRES_IN   : ${process.env.ACCESS_TOKEN_EXPIRES_IN ?? '(not set) → 15m'}`);
  console.log(`  REFRESH_TOKEN_EXPIRES_IN  : ${process.env.REFRESH_TOKEN_EXPIRES_IN ?? '(not set) → 7d'}`);
  console.log(`  JWT_SECRET                : ${process.env.JWT_SECRET ? '✅ set' : '❌ MISSING'}`);
  console.log(`  REFRESH_TOKEN_SECRET      : ${process.env.REFRESH_TOKEN_SECRET ? '✅ set' : '❌ MISSING'}`);
  console.log(`  AUTH_RATE_LIMIT_MAX       : ${process.env.AUTH_RATE_LIMIT_MAX ?? '(not set) → 20'}`);
  console.log(`  REFRESH_RATE_LIMIT_MAX    : ${process.env.REFRESH_RATE_LIMIT_MAX ?? '(not set) → 10'}`);
  console.log(`  DATABASE_URL              : ${process.env.DATABASE_URL ? '✅ set' : '❌ MISSING'}`);
  console.log('─────────────────────────────────────────');

  const { notificationEmitter } = setupSocket(server);

  registerCoreMiddleware(app, notificationEmitter);

  // Serve uploaded files as static assets.
  // acceptRanges: true enables HTTP Range requests required by video players.
  // setHeaders ensures correct Content-Type for .mp4 and other media files.
  app.use('/uploads', express.static(UPLOADS_DIR, {
    acceptRanges: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4'))  res.setHeader('Content-Type', 'video/mp4');
      if (filePath.endsWith('.webm')) res.setHeader('Content-Type', 'video/webm');
      if (filePath.endsWith('.mov'))  res.setHeader('Content-Type', 'video/quicktime');
    },
  }));

  // Serve static web files
  const publicDir = path.join(__dirname, '../../public');
  app.use(express.static(publicDir));

  registerRoutes(app);

  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    const indexHtml = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      next(); // Let error handlers catch it if index.html is missing
    }
  });

  registerErrorHandlers(app);

  startNotificationScheduler(notificationEmitter);
  startEmailIngestScheduler(notificationEmitter);

  // server.listen is async — errors (e.g. EADDRINUSE) are emitted, not thrown
  server.on('error', (error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });

  server.listen(PORT, HOST, () => {
    const protocol = detectProtocol();
    const base = `${protocol}://${HOST}:${PORT}`;
    console.log(`Server running on ${base}`);
    if (process.env.SWAGGER_ENABLED !== 'false') {
      console.log(`Swagger UI:  ${base}/api/docs`);
    }
  });

  // Handle both SIGINT (Ctrl+C) and SIGTERM (Docker/Kubernetes stop)
  process.on('SIGINT',  () => shutdown(server, 'SIGINT'));
  process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
}
