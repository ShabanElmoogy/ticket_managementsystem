import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import socketMiddleware from './socketMiddleware.js';
import { authenticateToken } from './auth.js';
import { resolveTenant, invalidateTenantCache } from './tenant.js';

export { resolveTenant, invalidateTenantCache };

export const authenticateAndResolveTenant = [authenticateToken, resolveTenant];

const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:5173',
      'https://localhost:5174',
      'https://ticketmanagement-ab491.web.app',
      'https://ticketmanagement-ab491.firebaseapp.com',
    ];

const logger = pinoHttp({
  autoLogging: true,
  quietReqLogger: true,
  customLogLevel: (req, res) => (res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, id: req.id }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export function registerCoreMiddleware(app, notificationEmitter) {
  app.use(cors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
  app.use(express.json());
  app.use(logger);
  app.use(socketMiddleware(notificationEmitter));
}
