import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config/env";

let socket: Socket | null = null;

export const getSocket = (userId: string, token?: string): Socket => {
  if (!socket) {
    // In dev, connect to same origin so Vite proxy handles it (avoids HTTPS/CORS issues)
    // In prod on MonsterASP, default to same origin unless an explicit socket URL is provided
    console.log('[Socket] Connecting to:', SOCKET_URL);

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      upgrade: false,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      secure: true,
      rejectUnauthorized: false,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
      socket?.emit("join", userId);
      console.log('[Socket] Joined room for user:', userId);
    });

    socket.on('notification', (data: unknown) => {
      console.log('[Socket] Notification received:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
