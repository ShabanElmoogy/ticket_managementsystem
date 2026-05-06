/**
 * Notifications feature — public barrel
 *
 * All imports from this feature must go through this file.
 * Never import from internal paths directly.
 *
 * Usage:
 *   import { notificationService, useNotifications, notificationsApi } from '@/src/features/notifications';
 */

// ── Service singleton ─────────────────────────────────────────────────────────
export { notificationService } from './services/NotificationService';

// ── Store ─────────────────────────────────────────────────────────────────────
export { useNotificationStore } from './stores/notificationStore';

// ── Hook ──────────────────────────────────────────────────────────────────────
export { useNotifications } from './hooks/useNotifications';

// ── API service + query keys ──────────────────────────────────────────────────
export { notificationsApi, notificationsKeys } from './api/notifications';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  NotificationPermissionStatus,
  NotificationItem,
  DeepLinkScreen,
  NotificationPayload,
  AndroidChannelId,
  PushTokenRegistration,
} from './types/types';
