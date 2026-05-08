import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { NotificationItem, PushTokenRegistration } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsApiService
// Extends BaseApiService following the same pattern as CustomersApiService.
// ─────────────────────────────────────────────────────────────────────────────

export class NotificationsApiService extends BaseApiService {
  /** GET /notifications — fetch all notifications for the current user (no pagination) */
  getNotifications = () =>
    this.get<NotificationItem[]>(API.NOTIFICATIONS.LIST);

  /** GET /notifications/count — fetch the current unread count */
  getUnreadCount = () =>
    this.get<{ count: number }>(API.NOTIFICATIONS.COUNT);

  /** PATCH /notifications/:id/read — mark a single notification as read */
  markAsRead = (id: string) =>
    this.patch<{ message: string }>(API.NOTIFICATIONS.READ(id), {});

  /** PATCH /notifications/:id/unread — mark a single notification as unread */
  markAsUnread = (id: string) =>
    this.patch<{ message: string }>(API.NOTIFICATIONS.UNREAD(id), {});

  /** POST /notifications/read-all — mark all notifications as read */
  markAllAsRead = () =>
    this.post<{ message: string }>(API.NOTIFICATIONS.READ_ALL, {});

  /** POST /notifications/unread-all — mark all notifications as unread */
  markAllAsUnread = () =>
    this.post<{ message: string }>(API.NOTIFICATIONS.UNREAD_ALL, {});

  /** POST /notifications/push-token — register a push token for the current user */
  registerPushToken = (data: PushTokenRegistration) =>
    this.post<{ message: string }>(API.NOTIFICATIONS.PUSH_TOKEN, data);

  /** DELETE /notifications/push-token — remove all push tokens for the current user */
  deletePushToken = () =>
    this.delete<{ message: string }>(API.NOTIFICATIONS.PUSH_TOKEN);
}

// ─────────────────────────────────────────────────────────────────────────────
// Singletons
// ─────────────────────────────────────────────────────────────────────────────

export const notificationsApi  = new NotificationsApiService();
export const notificationsKeys = QUERY_KEYS.NOTIFICATIONS;
