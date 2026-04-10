import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { getSocket } from '../services/socketService';

export const useSocketQuery = () => {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !token) return;

    const socket = getSocket(user.id, token);

    const handleNotification = (notification: any) => {
      if (["TICKET_CREATED", "TICKET_ASSIGNED", "TICKET_UPDATED", "PRIORITY_ESCALATED"].includes(notification.type)) {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [user, token, queryClient]);
};