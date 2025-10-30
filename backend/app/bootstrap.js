import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { PORT, HOST, CORS_ORIGINS } from './config/env.js';
import { createHttpOrHttpsServer, detectProtocol } from './config/httpServer.js';
import { setupSocket } from './sockets/io.js';
import { registerCoreMiddleware } from './middleware/index.js';
import { registerRoutes } from './routes/index.js';
import { registerErrorHandlers } from './errors/index.js';
import { connectDB, disconnectDB } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  const app = express();
  const server = createHttpOrHttpsServer(app);

  // Sockets
  const { io, notificationEmitter } = setupSocket(server);

  // Middleware
  registerCoreMiddleware(app, notificationEmitter);

  // Routes
  registerRoutes(app);

  // Static frontend (if available) and SPA fallback for same-origin deploys
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  // Errors
  registerErrorHandlers(app);

  // Start
  try {
    await connectDB();
    server.listen(PORT, HOST, () => {
      const protocol = detectProtocol();
      const hostForLog = process.env.HOST || 'localhost';
      console.log(`Server running on ${protocol}://${hostForLog}:${PORT}`);
      console.log(`API Base URL: ${protocol}://${hostForLog}:${PORT}/api`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS Origins: ${CORS_ORIGINS.join(', ')}`);
      // Startup JSON line
      console.log(JSON.stringify({
        name: 'Ticket Management API',
        status: 'OK',
        health: '/api/health',
        docs: 'Set service health check to /api/health; frontend served separately.'
      }));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await disconnectDB();
    process.exit(0);
  });
}
