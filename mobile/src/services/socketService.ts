import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/src/stores/authStore';
import { SOCKET } from '@/src/constants/api';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? 'https://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().token;
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect',       () => console.log('[Socket] Connected:', socket?.id));
    socket.on('disconnect',    (reason) => console.log('[Socket] Disconnected:', reason));
    socket.on('connect_error', (err)    => console.log('[Socket] Error:', err.message));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinUserRoom(userId: string) {
  getSocket().emit(SOCKET.EMIT.JOIN, `user_${userId}`);
}

export function joinTenantRoom(tenantId: string) {
  getSocket().emit(SOCKET.EMIT.JOIN_TENANT, `tenant_${tenantId}`);
}
