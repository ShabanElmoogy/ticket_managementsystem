/**
 * notifications.service.js
 * Business logic for the notifications module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './notifications.repository.js';
import { parsePaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Response normalizer ───────────────────────────────────────────────────────
// The DB column is `is_read` → Drizzle returns `isRead`.
// The mobile client and web client expect `read: boolean`.

function normalizeNotification(row) {
  const { isRead, ticket, ...rest } = row;
  return {
    ...rest,
    read: isRead ?? false,
    // Always include data — with ticket info when available
    data: ticket?.id
      ? { ticketId: ticket.id, ticketTitle: ticket.title }
      : {},
  };
}

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * List notifications with optional pagination.
 * @param {string} userId - User ID for scoping
 * @param {Object} options - Options including limit, unreadOnly, tenantId, and query
 * @returns {Array|Object} Array of notifications or paginated response
 */
export async function listNotifications(userId, { limit, unreadOnly, tenantId, query = {} }) {
  // Check if pagination is requested
  const hasPagination = 'page' in query || 'limit' in query;
  
  if (!hasPagination) {
    // Non-paginated — return all notifications up to the limit (no cap)
    const rows = await repo.findNotificationsByUserId(userId, {
      limit:      limit ?? 500,
      unreadOnly: unreadOnly === true || unreadOnly === 'true',
      tenantId:   tenantId ?? null,
    });
    return rows.map(normalizeNotification);
  }

  // Paginated response with validation
  const { page, limit: paginationLimit, offset } = parsePaginationParams(query);
  const finalLimit = limit ?? paginationLimit;
  
  // Additional validation for pagination parameters
  if (page < 1) {
    throw fail('Page must be >= 1', 400);
  }
  if (finalLimit < 1 || finalLimit > 100) {
    throw fail('Limit must be between 1 and 100', 400);
  }

  // Execute count and data queries in parallel for optimal performance
  const [data, total] = await Promise.all([
    repo.findNotificationsByUserId(userId, {
      limit: finalLimit,
      offset,
      unreadOnly: unreadOnly === true || unreadOnly === 'true',
      tenantId: tenantId ?? null,
    }),
    repo.countNotificationsByUserId(userId, {
      unreadOnly: unreadOnly === true || unreadOnly === 'true',
      tenantId: tenantId ?? null,
    }),
  ]);

  return buildPaginatedResponse(data.map(normalizeNotification), total, page, finalLimit);
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

export async function markAsUnread(id, userId) {
  const notification = await repo.findNotificationByIdAndUser(id, userId);
  if (!notification) throw fail('Notification not found', 404);
  const updated = await repo.markOneAsUnread(id);
  return updated;
}

export async function markAllAsUnread(userId) {
  await repo.markAllAsUnreadByUserId(userId);
  return { message: 'All notifications marked as unread' };
}

export async function deleteNotification(id, userId) {
  const notification = await repo.findNotificationByIdAndUser(id, userId);
  if (!notification) throw fail('Notification not found', 404);

  await repo.deleteNotificationById(id);
  return { message: 'Notification deleted successfully' };
}
