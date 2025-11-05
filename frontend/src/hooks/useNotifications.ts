// hooks/useNotifications.ts
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { type Notification, type UserInfo } from "../types/header";
import {
  createNotificationFromSocketData,
  playNotificationSound,
} from "../utils/notificationUtils";

interface UseNotificationsProps {
  user: UserInfo | null;
  token: string | null;
}

export const useNotifications = ({ user, token }: UseNotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(false);

  // Setup socket connection for notifications
  useEffect(() => {
    if (!user || !token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.PROD ? window.location.origin : "http://localhost:3001");
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Join user room for targeted notifications
    newSocket.emit("join", user.id);

    // Listen for notifications
    newSocket.on("notification", (socketNotification: any) => {
      const notification = createNotificationFromSocketData(socketNotification);

      setNotifications((prev) => [notification, ...prev.slice(0, 19)]); // Keep only last 20
      setUnreadCount((prev) => prev + 1);

      // Play notification sound
      playNotificationSound();
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // Load initial notifications
  useEffect(() => {
    const loadInitialNotifications = async () => {
      if (!token) return;

      try {
        setLoading(true);
        // If you have an API endpoint for notifications, load them here
        // const initialNotifications = await apiService.getNotifications(token);
        // setNotifications(initialNotifications);
        // setUnreadCount(initialNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialNotifications();
  }, [token]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((notif) => notif.id !== id);
      const newUnreadCount = updated.filter((notif) => !notif.read).length;
      setUnreadCount(newUnreadCount);
      return updated;
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    clearAllNotifications,
    removeNotification,
    markNotificationAsRead,
  };
};
