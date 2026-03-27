import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (userId: string, token?: string): Socket => {
  if (!socket) {
    // In dev, connect to same origin so Vite proxy handles it (avoids HTTPS/CORS issues)
    // In prod, connect directly to the backend URL
    const socketUrl = import.meta.env.DEV
      ? window.location.origin
      : (import.meta.env.VITE_SOCKET_URL || "https://ticket-managementsystem-2.onrender.com");
    console.log('[Socket] Connecting to:', socketUrl);

    socket = io(socketUrl, {
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

    socket.on('notification', (data: any) => {
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
