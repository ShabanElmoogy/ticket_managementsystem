/**
 * notifications.repository.js
 * All database queries for the notifications module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { notifications } from './notifications.schema.js';
import { notificationReads } from './notificationReads.schema.js';
import { users } from '../users/users.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { eq, and, desc, count, isNull, isNotNull } from 'drizzle-orm';

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * List notifications for a user, optionally filtered by unread status
 * and scoped to a tenant (via user join).
 */
export async function findNotificationsByUserId(userId, { limit = 50, offset, unreadOnly = false, tenantId = null } = {}) {
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  // Use notifications.tenantId directly — no join with users needed
  if (tenantId)   conditions.push(eq(notifications.tenantId, tenantId));

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
    .leftJoin(tickets, eq(notifications.ticketId, tickets.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));

  if (limit !== undefined) query = query.limit(limit);
  if (offset !== undefined) query = query.offset(offset);

  return query;
}

/**
 * Count notifications for a user for pagination.
 */
export async function countNotificationsByUserId(userId, { unreadOnly = false, tenantId = null } = {}) {
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  if (tenantId)   conditions.push(eq(notifications.tenantId, tenantId));

  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(...conditions));

  return Number(result.count);
}

/** Count unread notifications for a user, optionally tenant-scoped. */
export async function countUnreadByUserId(userId, tenantId) {
  const conditions = [
    eq(notifications.userId, userId),
    eq(notifications.isRead, false),
  ];
  if (tenantId) conditions.push(eq(notifications.tenantId, tenantId));

  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(...conditions));

  return Number(result.count);
}

/**
 * List ALL notifications for a tenant (all users in the tenant).
 * Used for the activity feed — shows everything happening in the tenant.
 * Falls back to user-scoped query when tenant_id is NULL on rows (pre-migration data).
 */
export async function findNotificationsByTenantId(tenantId, { limit = 500, offset, unreadOnly = false } = {}) {
  const conditions = [eq(notifications.tenantId, tenantId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));

  let query = db
    .select({
      id:        notifications.id,
      title:     notifications.title,
      message:   notifications.message,
      type:      notifications.type,
      isRead:    notifications.isRead,
      createdAt: notifications.createdAt,
      userId:    notifications.userId,
      ticket: {
        id:    tickets.id,
        title: tickets.title,
      },
    })
    .from(notifications)
    .leftJoin(tickets, eq(notifications.ticketId, tickets.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));

  if (limit !== undefined) query = query.limit(limit);
  if (offset !== undefined) query = query.offset(offset);

  return query;
}

/**
 * List notifications for all users in a tenant by joining with users table.
 * Used as fallback when tenant_id column is not yet populated on old rows.
 */
/**
 * List ALL notifications for a tenant with per-user read state.
 * LEFT JOINs notification_reads for the requesting user — if a row exists, it's read.
 */
export async function findNotificationsByTenantViaUsers(tenantId, { limit = 500, offset, unreadOnly = false, currentUserId = null } = {}) {
  const conditions = [eq(users.tenantId, tenantId)];
  if (unreadOnly) conditions.push(isNull(notificationReads.readAt));

  let query = db
    .select({
      id:        notifications.id,
      title:     notifications.title,
      message:   notifications.message,
      type:      notifications.type,
      // isRead = true when a read receipt exists for this user
      isRead:    isNotNull(notificationReads.readAt),
      createdAt: notifications.createdAt,
      userId:    notifications.userId,
      ticket: {
        id:    tickets.id,
        title: tickets.title,
      },
    })
    .from(notifications)
    .innerJoin(users,   eq(notifications.userId, users.id))
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        currentUserId ? eq(notificationReads.userId, currentUserId) : eq(notificationReads.userId, notifications.userId),
      )
    )
    .leftJoin(tickets, eq(notifications.ticketId, tickets.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));

  if (limit !== undefined) query = query.limit(limit);
  if (offset !== undefined) query = query.offset(offset);

  return query;
}

/** Mark a notification as read for a specific user (upsert read receipt). */
export async function markReadForUser(notificationId, userId) {
  console.log('[markReadForUser] notificationId:', notificationId, '| userId:', userId);
  try {
    const result = await db
      .insert(notificationReads)
      .values({ notificationId, userId })
      .onConflictDoNothing()
      .returning();
    console.log('[markReadForUser] inserted:', result.length, 'row(s)');
  } catch (err) {
    console.error('[markReadForUser] ERROR:', err.message, err);
    throw err;
  }
}

/** Mark a notification as unread for a specific user (delete read receipt). */
export async function markUnreadForUser(notificationId, userId) {
  await db
    .delete(notificationReads)
    .where(and(
      eq(notificationReads.notificationId, notificationId),
      eq(notificationReads.userId, userId),
    ));
}

/** Mark all notifications in a tenant as read for a specific user. */
export async function markAllReadForUser(userId, tenantId) {
  // Find all notification IDs for this tenant that the user hasn't read yet
  const unread = await db
    .select({ id: notifications.id })
    .from(notifications)
    .innerJoin(users, eq(notifications.userId, users.id))
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.userId, userId),
      )
    )
    .where(and(eq(users.tenantId, tenantId), isNull(notificationReads.readAt)));

  if (!unread.length) return;

  await db
    .insert(notificationReads)
    .values(unread.map((n) => ({ notificationId: n.id, userId })))
    .onConflictDoNothing();
}

/** Mark all notifications in a tenant as unread for a specific user. */
export async function markAllUnreadForUser(userId, tenantId) {
  // Delete all read receipts for this user's tenant notifications
  const notifIds = await db
    .select({ id: notifications.id })
    .from(notifications)
    .innerJoin(users, eq(notifications.userId, users.id))
    .where(eq(users.tenantId, tenantId));

  if (!notifIds.length) return;

  for (const { id } of notifIds) {
    await db
      .delete(notificationReads)
      .where(and(
        eq(notificationReads.notificationId, id),
        eq(notificationReads.userId, userId),
      ));
  }
}

/** Count unread notifications for a user in a tenant. */
export async function countUnreadForUser(userId, tenantId) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .innerJoin(users, eq(notifications.userId, users.id))
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.userId, userId),
      )
    )
    .where(and(eq(users.tenantId, tenantId), isNull(notificationReads.readAt)));

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

/** Mark a single notification as unread, returns the updated row. */
export async function markOneAsUnread(id) {
  const [row] = await db
    .update(notifications)
    .set({ isRead: false })
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

/** Mark all read notifications for a user as unread. */
export async function markAllAsUnreadByUserId(userId) {
  await db
    .update(notifications)
    .set({ isRead: false })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, true)));
}

/** Delete a notification by ID. */
export async function deleteNotificationById(id) {
  await db.delete(notifications).where(eq(notifications.id, id));
}
