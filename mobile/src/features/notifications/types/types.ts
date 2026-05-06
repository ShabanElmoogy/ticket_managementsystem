import type { NotificationType } from '@/src/services/api/types/notification';

// ─────────────────────────────────────────────────────────────────────────────
// Permission status
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unavailable'; // simulator, web, or Expo Go

// ─────────────────────────────────────────────────────────────────────────────
// Deep link navigation target
// ─────────────────────────────────────────────────────────────────────────────

export type DeepLinkScreen =
  | 'ticket-detail'
  | 'notifications'
  | 'dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Android notification channel IDs
// ─────────────────────────────────────────────────────────────────────────────

export type AndroidChannelId =
  | 'ticket-updates'
  | 'mentions'
  | 'reminders'
  | 'general';

// ─────────────────────────────────────────────────────────────────────────────
// Notification item — a single record in the notification list
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id:        string;
  type:      NotificationType;
  title:     string;
  message:   string;
  read:      boolean;
  createdAt: string; // ISO string
  data?: {
    screen?:   DeepLinkScreen;
    params?:   Record<string, string>;
    ticketId?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Push notification payload — shape sent by the backend via Expo Push API
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  title:     string;
  body:      string;
  data: {
    type:      NotificationType;
    screen?:   DeepLinkScreen;
    params?:   Record<string, string>;
    ticketId?: string;
  };
  sound?:     string;
  badge?:     number;
  channelId?: AndroidChannelId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Push token registration payload — sent to POST /notifications/push-token
// ─────────────────────────────────────────────────────────────────────────────

export interface PushTokenRegistration {
  token:    string;
  platform: 'ios' | 'android';
}
