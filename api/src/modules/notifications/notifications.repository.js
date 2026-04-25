/**
 * notifications.repository.js
 * All database queries for the notifications module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { notifications } from './notifications.schema.js';
import { users } from '../users/users.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { eq, and, desc, count, sql } from 'drizzle-orm';

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * List notifications for a user, optionally filtered by unread status
 * and scoped to a tenant (via user join).
 */
export async function findNotificationsByUserId(userId, { limit = 50, offset, unreadOnly = false, tenantId = null } = {}) {
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  if (tenantId)   conditions.push(eq(users.tenantId, tenantId));

  let query = db
    .select({
      id:        notifications.id,
      title:     notifications.title,
      message:   notifications.message,
      type:      notifications.type,
      isRead:    notifications.isRead,
      createdAt: notifications.createdAt,
      ticket: {
        id:    tickets.id,
        title: tickets.title,
      },
    })
    .from(notifications)
    .leftJoin(users,   eq(notifications.userId,   users.id))
    .leftJoin(tickets, eq(notifications.ticketId, tickets.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));

  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.offset(offset);
  }

  return query;
}

/**
 * Count notifications for a user for pagination.
 */
export async function countNotificationsByUserId(userId, { unreadOnly = false, tenantId = null } = {}) {
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  if (tenantId)   conditions.push(eq(users.tenantId, tenantId));

  const [result] = tenantId
    ? await db
        .select({ count: count() })
        .from(notifications)
        .leftJoin(users, eq(notifications.userId, users.id))
        .where(and(...conditions))
    : await db
        .select({ count: count() })
        .from(notifications)
        .where(and(...conditions));

  return Number(result.count);
}

/** Count unread notifications for a user, optionally tenant-scoped. */
export async function countUnreadByUserId(userId, tenantId) {
  const baseWhere = and(eq(notifications.userId, userId), eq(notifications.isRead, false));

  const [result] = tenantId
    ? await db
        .select({ count: count() })
        .from(notifications)
        .leftJoin(users, eq(notifications.userId, users.id))
        .where(and(baseWhere, eq(users.tenantId, tenantId)))
    : await db
        .select({ count: count() })
        .from(notifications)
        .where(baseWhere);

  return Number(result.count);
}

/** Find a notification by ID, scoped to a user (ownership check). */
export async function findNotificationByIdAndUser(id, userId) {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Mark a single notification as read, returns the updated row. */
export async function markOneAsRead(id) {
  const [row] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();
  return row ?? null;
}

/** Mark all unread notifications for a user as read. */
export async function markAllAsReadByUserId(userId) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

/** Delete a notification by ID. */
export async function deleteNotificationById(id) {
  await db.delete(notifications).where(eq(notifications.id, id));
}
