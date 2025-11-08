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

  // Disabled - using activity feed socket instead

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
