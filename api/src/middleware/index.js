import cors from 'cors';
import express from 'express';
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

// ── Core middleware registration ──────────────────────────────────────────────

export function registerCoreMiddleware(app, notificationEmitter) {
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

  // Explicit body size limit — prevents oversized JSON payloads
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? '1mb' }));
  app.use(logger);
  app.use(socketMiddleware(notificationEmitter));
}
