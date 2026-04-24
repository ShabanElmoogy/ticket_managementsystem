/**
 * notifications.service.js
 * Business logic for the notifications module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './notifications.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listNotifications(userId, { limit, unreadOnly, tenantId }) {
  return repo.findNotificationsByUserId(userId, {
    limit:      limit ?? 50,
    unreadOnly: unreadOnly === true || unreadOnly === 'true',
    tenantId:   tenantId ?? null,
  });
}

export async function getUnreadCount(userId, tenantId) {
  const unreadCount = await repo.countUnreadByUserId(userId, tenantId ?? null);
  return { unreadCount };
}

export async function markAsRead(id, userId) {
  const notification = await repo.findNotificationByIdAndUser(id, userId);
  if (!notification) throw fail('Notification not found', 404);

  const updated = await repo.markOneAsRead(id);
  return updated;
}

export async function markAllAsRead(userId) {
  await repo.markAllAsReadByUserId(userId);
  return { message: 'All notifications marked as read' };
}

export async function deleteNotification(id, userId) {
  const notification = await repo.findNotificationByIdAndUser(id, userId);
  if (!notification) throw fail('Notification not found', 404);

  await repo.deleteNotificationById(id);
  return { message: 'Notification deleted successfully' };
}
