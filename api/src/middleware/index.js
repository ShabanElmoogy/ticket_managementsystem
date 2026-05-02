import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import socketMiddleware from './socketMiddleware.js';
import { resolveTenant, invalidateTenantCache } from './tenant.js';
import { CORS_ORIGINS } from '../config/cors.js';

export { resolveTenant, invalidateTenantCache };

// ── Pino HTTP logger ──────────────────────────────────────────────────────────

const logger = pinoHttp({
  autoLogging:    true,
  quietReqLogger: true,
  customLogLevel: (req, res) =>
    res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, id: req.id }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

// ── Rate limiter for auth endpoints ──────────────────────────────────────────

export const authRateLimit = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 minutes
  max:            parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '20', 10),
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { error: 'Too many requests, please try again later.' },
});

// ── Rate limiter for token refresh ───────────────────────────────────────────
// Keyed by the refresh token body value, NOT by IP.
//
// Why not IP? On a shared/hosted server (Render, Railway, etc.) all users
// share the same egress IP. An IP-based limit of 30/15min would be exhausted
// by ~2 concurrent users with 1h tokens (each refreshes ~once per hour).
//
// Keying by refresh token means each token gets its own counter:
//   - Legitimate client: 1 refresh per token lifetime → never hits the limit
//   - Stolen token being hammered: hits the limit after MAX attempts
//
// Falls back to IP if the body can't be parsed (malformed request).

export const refreshRateLimit = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             parseInt(process.env.REFRESH_RATE_LIMIT_MAX ?? '10', 10),
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many refresh attempts, please try again later.' },
  keyGenerator:    (req) => {
    // Use the refresh token as the rate-limit key so each token has its own
    // counter. Truncate to 16 chars — enough to be unique, avoids storing
    // full secrets in the rate-limit store.
    const token = req.body?.refreshToken;
    if (typeof token === 'string' && token.length > 0) {
      return `rt:${token.slice(0, 16)}`;
    }
    // Fallback to IP for malformed requests
    return req.ip ?? 'unknown';
  },
});

// ── Core middleware registration ──────────────────────────────────────────────

export function registerCoreMiddleware(app, notificationEmitter) {
  // ── Security headers ────────────────────────────────────────────────────────
  // helmet sets: X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy,
  // X-XSS-Protection, Permissions-Policy, and more.
  // CSP is configured to allow Swagger UI assets and the API's own origin.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],  // Swagger UI
        styleSrc:       ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],  // Swagger UI
        imgSrc:         ["'self'", 'data:', 'cdn.jsdelivr.net'],
        connectSrc:     ["'self'"],
        fontSrc:        ["'self'", 'cdn.jsdelivr.net'],
        objectSrc:      ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    // HSTS: enforce HTTPS for 1 year in production
    strictTransportSecurity: process.env.NODE_ENV === 'production'
      ? { maxAge: 31_536_000, includeSubDomains: true }
      : false,
    // Allow Swagger UI to be embedded in iframes on the same origin
    frameguard: { action: 'sameorigin' },
    // Disable X-Powered-By (already done by helmet by default)
    hidePoweredBy: true,
  }));

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(cors({
    origin:       CORS_ORIGINS,
    credentials:  true,
    methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Requested-With',
      'X-Tenant-Slug',
      'X-Tenant-Id',
    ],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400,
  }));

  // ── Body parsing + logging + socket ────────────────────────────────────────
  // Explicit body size limit — prevents oversized JSON payloads
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? '1mb' }));
  app.use(logger);
  app.use(socketMiddleware(notificationEmitter));
}
