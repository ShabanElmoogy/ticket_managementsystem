/**
 * startup.js — IIS deployment entry point.
 *
 * IIS Node uses this file instead of server.js so it can:
 *  1. Ensure the logs/ directory exists (IIS redirects stdout/stderr there)
 *  2. Verify node_modules is present before launching
 *
 * Normal development: use `npm start` (server.js directly).
 */

import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure logs/ directory exists — IIS redirects stdout/stderr here
const logsDir = join(__dirname, 'logs');
if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });

// Fail fast if node_modules is missing — deployment is incomplete.
// Run `npm install --omit=dev` as part of the deploy step, not at runtime.
const nodeModules = join(__dirname, 'node_modules');
if (!existsSync(nodeModules)) {
  console.error('[startup] node_modules not found. Run npm install before starting.');
  process.exit(1);
}

import('./server.js').catch((err) => {
  console.error('[startup] Failed to start server:', err);
  process.exit(1);
});