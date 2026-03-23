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
    
    socket.on("notification", (notification: any) => {
      if (notification.type === "TICKET_CREATED" || notification.type === "TICKET_ASSIGNED" || notification.type === "TICKET_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      }
    });

    return () => {
      socket.off("notification");
    };
  }, [user, token, queryClient]);
};