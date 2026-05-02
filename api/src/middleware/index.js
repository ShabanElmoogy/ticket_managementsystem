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
// Tighter than authRateLimit — refresh is called automatically by clients,
// so a stolen refresh token should not be able to hammer the endpoint.
// 30 requests per 15 min per IP is generous for legitimate use (proactive
// refresh fires once per token lifetime, ~every 15 min).

export const refreshRateLimit = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             parseInt(process.env.REFRESH_RATE_LIMIT_MAX ?? '30', 10),
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many refresh attempts, please try again later.' },
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
