/**
 * useGlobalActivityCount — Global socket listener for activity feed unread count.
 *
 * Runs at the app root level (mounted in _layout.tsx) so the bell badge
 * in AppHeaderBar always reflects the latest unread count regardless of
 * which screen is active.
 *
 * - Increments uiStore.unreadCount on every incoming socket notification
 * - Resets to 0 when the user opens the activity feed screen
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useUiStore } from '@/src/stores/uiStore';
import { SOCKET } from '@/src/constants/api';

export function useGlobalActivityCount() {
  const incrementUnread = useUiStore((s) => s.incrementUnread);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let socket: any = null;
    try {
      const { getSocket } = require('@/src/services/socketService');
      socket = getSocket();
    } catch {
      return;
    }

    if (!socket) return;

    const handler = (raw: any) => {
      if (!raw?.type) return;
      // Increment the global bell badge count on any notification
      incrementUnread();
    };

    socket.on(SOCKET.EVENTS.NOTIFICATION, handler);

    return () => {
      socket?.off(SOCKET.EVENTS.NOTIFICATION, handler);
    };
  }, [incrementUnread]);
}
