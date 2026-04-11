import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure logs directory exists (IIS won't create it)
const logsDir = join(__dirname, 'logs');
if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });
const nodeModules = join(__dirname, 'node_modules');

if (!existsSync(nodeModules)) {
  console.log('[startup] node_modules not found, running npm install...');
  try {
    execSync('npm install --omit=dev --prefer-offline', {
      stdio: 'inherit',
      cwd: __dirname,
      timeout: 300000, // 5 min max
    });
    console.log('[startup] npm install completed.');
  } catch (err) {
    console.error('[startup] npm install failed:', err.message);
    process.exit(1);
  }
}

console.log('[startup] Starting server...');
import('./server.js').catch((err) => {
  console.error('[startup] Failed to start server:', err);
  process.exit(1);
});
