import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { USE_HTTPS } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createHttpOrHttpsServer(app) {
  let server;
  if (USE_HTTPS) {
    try {
      const keyPath = path.join(__dirname, '..', '..', '.cert', 'key.pem');
      const certPath = path.join(__dirname, '..', '..', '.cert', 'key.pem');

      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        const httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        server = createHttpsServer(httpsOptions, app);
        console.log('HTTPS server enabled');
      } else {
        console.log('HTTPS certificates not found, falling back to HTTP');
        server = createServer(app);
      }
    } catch (error) {
      console.log('Error loading HTTPS certificates, falling back to HTTP:', error.message);
      server = createServer(app);
    }
  } else {
    server = createServer(app);
  }
  return server;
}

export function detectProtocol() {
  const certPath = path.join(__dirname, '..', '..', '.cert', 'key.pem');
  return USE_HTTPS && fs.existsSync(certPath) ? 'https' : 'http';
}