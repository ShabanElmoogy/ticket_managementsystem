import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (userId: string): Socket => {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://ticket-managementsystem-2.onrender.com");
    console.log('Connecting to socket URL:', socketUrl);

    socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
      socket?.emit("join", userId);
      console.log('Emitted join event for user:', userId);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
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
