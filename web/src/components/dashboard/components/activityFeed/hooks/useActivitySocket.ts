import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useAuthStore } from "../../../../../stores/authStore";
import type { ActivityItem } from "../../../../../services/api/types";
import { getSocket, disconnectSocket } from "../../../../../services/socketService";

interface SocketNotification {
  id?: string;
  type?: ActivityItem['type'];
  data?: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    assigneeName?: string;
    commentBy?: string;
    mentionedBy?: string;
    mentionedUsers?: string[];
    comment?: string;
    newStatus?: string;
  };
  ticketId?: string;
  title?: string;
  createdAt?: string;
  timestamp?: string;
}

export const useActivitySocket = (
  setActivities: React.Dispatch<React.SetStateAction<ActivityItem[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>
) => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const socket: Socket = getSocket(user.id);

    const handleNotification = (notification: SocketNotification) => {
      console.log('Received notification:', notification);
      const activityItem: ActivityItem = {
        id: notification.id || Date.now().toString(),
        type: notification.type || "TICKET_ASSIGNED",
        data: {
          ticket: notification.data?.ticket || (notification.ticketId ? {
            id: notification.ticketId,
            title: notification.title || "New Ticket"
          } : undefined),
          createdBy: notification.data?.createdBy,
          updatedBy: notification.data?.updatedBy,
          assignedTo: notification.data?.assignedTo || notification.data?.assigneeName,
          commentBy: notification.data?.commentBy,
          mentionedUsers: notification.data?.mentionedUsers,
          mentionedBy: notification.data?.mentionedBy,
          comment: notification.data?.comment,
          newStatus: notification.data?.newStatus,
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
      } catch (error) {
        console.error("Error playing notification sound:", error);
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
      disconnectSocket();
    };
  }, [user, setActivities, setUnreadCount]);

  return getSocket(user?.id || "");
};
