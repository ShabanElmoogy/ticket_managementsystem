/**
 * useNotifications
 *
 * Thin bridge between NotificationStore and UI components.
 * Reads state from `useNotificationStore` and exposes actions bound to
 * `notificationService` — components never import the service directly.
 *
 * Usage:
 *   const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
 */

import { useNotificationStore } from '../stores/notificationStore';
import { notificationService }  from '../services/NotificationService';

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useNotifications() {
  // ── State — individual selectors to avoid unnecessary re-renders ────────────
  const notifications          = useNotificationStore((s) => s.notifications);
  const unreadCount            = useNotificationStore((s) => s.unreadCount);
  const permissionStatus       = useNotificationStore((s) => s.permissionStatus);
  const pushToken              = useNotificationStore((s) => s.pushToken);
  const tokenRegistrationFailed = useNotificationStore((s) => s.tokenRegistrationFailed);

  return {
    // ── State ─────────────────────────────────────────────────────────────────
    notifications,
    unreadCount,
    permissionStatus,
    pushToken,
    tokenRegistrationFailed,

    // ── Actions ───────────────────────────────────────────────────────────────

    /** Mark a single notification as read on the backend and in the store. */
    markAsRead: notificationService.markAsRead.bind(notificationService),

    /** Mark all notifications as read on the backend, clear the badge, and update the store. */
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),

    /** Clear all session-only notification state (called on logout or manual clear). */
    clearAll: () => useNotificationStore.getState().reset(),
  };
}
