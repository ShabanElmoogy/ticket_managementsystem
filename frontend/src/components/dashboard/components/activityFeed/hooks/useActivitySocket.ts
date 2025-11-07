import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../../../../../stores/authStore";
import type { ActivityItem } from "../components/shared/types";

export const useActivitySocket = (
  setActivities: React.Dispatch<React.SetStateAction<ActivityItem[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>
) => {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://ticket-managementsystem-2.onrender.com");
    console.log('Connecting to socket URL:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit("join", user.id);
      console.log('Emitted join event for user:', user.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on("notification", (notification: any) => {
      console.log('Received notification:', notification);
      const activityItem: ActivityItem = {
        id: notification.id || Date.now().toString(),
        type: notification.type || "TICKET_ASSIGNED",
        data: {
          ticket: notification.data?.ticket || (notification.ticketId ? {
            id: notification.ticketId,
            title: notification.title || "New Ticket"
          } : undefined),
          assignedTo: notification.data?.assigneeName || user?.name,
          createdBy: "Admin"
        },
        timestamp: notification.timestamp || notification.createdAt || new Date().toISOString(),
        read: false
      };
      
      setActivities((prev) => [activityItem, ...prev.slice(0, 19)]);
      setUnreadCount((prev) => prev + 1);

      try {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
        );
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, setActivities, setUnreadCount]);

  return socket;
};