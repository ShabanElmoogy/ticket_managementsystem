import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import socketMiddleware from './socketMiddleware.js';

const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) 
  : ['http://localhost:3000', 'http://localhost:5173', 'https://localhost:5173', 'https://localhost:5174'];

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
      'X-Tenant-Slug',
      'X-Tenant-Id',
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
