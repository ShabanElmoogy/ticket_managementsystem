import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createHttpOrHttpsServer(app) {
  const USE_HTTPS = process.env.USE_HTTPS === 'true';
  let server;
  if (USE_HTTPS) {
    try {
      const keyPath = path.join(__dirname, '..', '..', '.cert', 'key.pem');
      const certPath = path.join(__dirname, '..', '..', '.cert', 'cert.pem');

      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        const httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        server = createHttpsServer(httpsOptions, app);
        console.log('HTTPS server enabled with certificates from .cert directory');
      } else {
        console.warn('HTTPS certificates not found in .cert directory, falling back to HTTP');
        server = createServer(app);
      }
    } catch (error) {
      console.error('Error loading HTTPS certificates, falling back to HTTP:', error.message);
      server = createServer(app);
    }
  } else {
    server = createServer(app);
  }
  return server;
}

/**
 * Detects the protocol (http or https) based on USE_HTTPS and certificate availability.
 * @returns {string} 'https' if HTTPS is enabled and certificates exist, otherwise 'http'.
 */
export function detectProtocol() {
  const USE_HTTPS = process.env.USE_HTTPS === 'true';
  const keyPath = path.join(__dirname, '..', '..', '.cert', 'key.pem');
  const certPath = path.join(__dirname, '..', '..', '.cert', 'cert.pem');
  return USE_HTTPS && fs.existsSync(keyPath) && fs.existsSync(certPath) ? 'https' : 'http';
}