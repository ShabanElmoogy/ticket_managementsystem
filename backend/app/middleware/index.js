import cors from 'cors';
import express from 'express';
import { CORS_ORIGINS } from '../config/env.js';
import socketMiddleware from '../../middleware/socketMiddleware.js';

export function registerCoreMiddleware(app, notificationEmitter) {
  app.use(cors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Inject socket notification function into req
  app.use(socketMiddleware(notificationEmitter));
}