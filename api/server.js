// Node.js 18+ required for native ESM, fetch, and other APIs used in this project
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`Node.js 18+ required. Current: ${process.versions.node}`);
  process.exit(1);
}

// Global safety nets — catch anything that escapes a try/catch after startup
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

import { startServer } from './src/bootstrap.js';

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
