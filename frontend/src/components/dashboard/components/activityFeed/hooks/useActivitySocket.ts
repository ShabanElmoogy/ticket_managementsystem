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

    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:3001" : window.location.origin);
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.emit("join", user.id);

    newSocket.on("notification", (notification: any) => {
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