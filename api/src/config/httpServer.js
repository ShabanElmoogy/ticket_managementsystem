import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Certificate paths ─────────────────────────────────────────────────────────

const KEY_PATH  = path.join(__dirname, '..', '..', '.cert', 'key.pem');
const CERT_PATH = path.join(__dirname, '..', '..', '.cert', 'cert.pem');

function certsExist() {
  return fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);
}

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Creates an HTTP or HTTPS server depending on USE_HTTPS env var and cert availability.
 * Logging is intentionally omitted — let the caller (bootstrap.js) log the result.
 */
export function createHttpOrHttpsServer(app) {
  if (process.env.USE_HTTPS === 'true') {
    if (certsExist()) {
      try {
        const httpsOptions = {
          key:  fs.readFileSync(KEY_PATH),
          cert: fs.readFileSync(CERT_PATH),
        };
        return createHttpsServer(httpsOptions, app);
      } catch (error) {
        // Cert files exist but are unreadable — fall through to HTTP
        console.error('Error loading HTTPS certificates, falling back to HTTP:', error.message);
      }
    }
  }
  return createServer(app);
}

/**
 * Returns 'https' if HTTPS is enabled and certificates are present, otherwise 'http'.
 */
export function detectProtocol() {
  return process.env.USE_HTTPS === 'true' && certsExist() ? 'https' : 'http';
}
