import { Server } from 'socket.io';
import { emitNotification } from '../utils/socketHelpers.js';
import { verifyAccessToken } from '../utils/tokenService.js';
import 'dotenv/config';

export function setupSocket(server) {
  const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : true;

  const io = new Server(server, {
    cors: {
      origin: CORS_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    allowEIO3: true,
  });

  // Authenticate every socket connection via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Only allow joining the room that matches the authenticated user
    const authedUserId = socket.user?.userId;
    if (authedUserId) socket.join(`user_${authedUserId}`);

    socket.on('join', (userId) => {
      if (String(userId) !== String(authedUserId)) return;
      socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {});
  });

  const notificationEmitter = emitNotification(io);
  return { io, notificationEmitter };
}