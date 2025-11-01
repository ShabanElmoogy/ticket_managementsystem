import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { CORS_ORIGINS } from '../config/env.js';
import socketMiddleware from './socketMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    ],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24 hours
  }));
  app.use(express.json());

  // Serve static files from frontend dist
  const frontendPath = path.join(__dirname, '../../../frontend/dist');
  app.use(express.static(frontendPath));

  // Inject socket notification function into req
  app.use(socketMiddleware(notificationEmitter));
}