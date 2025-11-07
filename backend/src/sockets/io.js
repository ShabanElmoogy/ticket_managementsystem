import { Server } from 'socket.io';
import { emitNotification } from '../utils/socketHelpers.js';
import "dotenv/config";

export function setupSocket(server) {
  const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : true;
  console.log("CORS_ORIGINS", CORS_ORIGINS);
  const io = new Server(server, {
    cors: {
      origin: CORS_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    allowEIO3: true,
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
      console.log(`Room user_${userId} now has ${io.sockets.adapter.rooms.get(`user_${userId}`)?.size || 0} members`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  const notificationEmitter = emitNotification(io);
  return { io, notificationEmitter };
}