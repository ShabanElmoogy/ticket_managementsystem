import { Server } from 'socket.io';
import { createNotificationEmitter } from '../utils/socketHelpers.js';
import { verifyAccessToken } from '../utils/tokenService.js';
import { CORS_ORIGINS } from '../config/cors.js';

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin:         CORS_ORIGINS,
      methods:        ['GET', 'POST', 'PUT', 'DELETE'],
      credentials:    true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    // allowEIO3 removed — frontend uses Socket.IO v4, legacy protocol not needed
  });

  // ── JWT authentication middleware ─────────────────────────────────────────

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) return next(new Error('Authentication required'));

    try {
      socket.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────

  io.on('connection', (socket) => {
    // socket.user is always set — auth middleware verified it above
    const userId = socket.user.userId;

    // Join the user's private room immediately on connect.
    // All targeted notifications are emitted to user_<id>.
    socket.join(`user_${userId}`);
  });

  const notificationEmitter = createNotificationEmitter(io);
  return { io, notificationEmitter };
}
