/**
 * comments.repository.js
 * All database queries for the comments module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { comments } from './comments.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, or } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

const COMMENT_COLUMNS = {
  id:        comments.id,
  content:   comments.content,
  ticketId:  comments.ticketId,
  userId:    comments.userId,
  createdAt: comments.createdAt,
  updatedAt: comments.updatedAt,
};

// ── Ticket access checks ──────────────────────────────────────────────────────

/**
 * Find a ticket by ID scoped to a tenant.
 * Tickets have no tenantId column — scope is determined by checking that at
 * least one of the ticket's user references (creator, assignee, programmer)
 * belongs to the tenant. This correctly handles tickets created by super-admins.
 */
export async function findTicketInTenant(ticketId, tenantId) {
  // Fetch the ticket first, then verify tenant membership via any user reference
  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  const ticket = rows[0] ?? null;
  if (!ticket) return null;

  // Collect all non-null user IDs on the ticket
  const userIds = [ticket.createdById, ticket.assignedToId, ticket.programmerId].filter(Boolean);
  if (!userIds.length) return null;

  // Check if any of those users belong to the tenant
  const memberRows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), or(...userIds.map((uid) => eq(users.id, uid)))))
    .limit(1);

  return memberRows.length > 0 ? ticket : null;
}

/** Find a ticket by ID globally (super-admin). */
export async function findTicketById(ticketId) {
  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  return rows[0] ?? null;
}

/** Verify a user belongs to a tenant. */
export async function findUserInTenant(userId, tenantId) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

// ── Comment queries ───────────────────────────────────────────────────────────

/** Find a comment by ID. */
export async function findCommentById(commentId) {
  const rows = await db
    .select(COMMENT_COLUMNS)
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a comment, returns the created row. */
export async function insertComment(values) {
  const [comment] = await db
    .insert(comments)
    .values(values)
    .returning(COMMENT_COLUMNS);
  return comment;
}

/** Delete a comment by ID. */
export async function deleteCommentById(commentId) {
  await db.delete(comments).where(eq(comments.id, commentId));
}

// ── Notification helpers ──────────────────────────────────────────────────────

/** Get safe user info (id, name, email) by ID. */
export async function findUserById(userId) {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Get all user IDs in a tenant (for broadcast notifications). */
export async function findTenantUserIds(tenantId) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.tenantId, tenantId));
  return rows.map((r) => r.id);
}

/** Get all users with name + id for mention resolution. */
export async function findUsersForMentions(tenantId) {
  const rows = tenantId
    ? await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.tenantId, tenantId))
    : await db.select({ id: users.id, name: users.name }).from(users);
  return rows;
}
