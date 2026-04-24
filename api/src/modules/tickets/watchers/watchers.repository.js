/**
 * watchers/watchers.repository.js
 * All database queries for the ticket watchers sub-module.
 * No business logic — only data access.
 */

import { db } from '../../../config/database.js';
import { ticketWatchers } from './watchers.schema.js';
import { users } from '../../users/users.schema.js';
import { tickets } from '../tickets.schema.js';
import { eq, and } from 'drizzle-orm';

/** List watchers for a ticket with user info. */
export async function findWatchersByTicketId(ticketId) {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(ticketWatchers)
    .innerJoin(users, eq(ticketWatchers.userId, users.id))
    .where(eq(ticketWatchers.ticketId, ticketId));
}

/** Get watcher user IDs for a ticket (for notification broadcast). */
export async function findWatcherIds(ticketId) {
  const rows = await db
    .select({ userId: ticketWatchers.userId })
    .from(ticketWatchers)
    .where(eq(ticketWatchers.ticketId, ticketId));
  return rows.map((r) => r.userId);
}

/** Add a watcher (idempotent). */
export async function insertWatcher(ticketId, userId) {
  await db.insert(ticketWatchers).values({ ticketId, userId }).onConflictDoNothing();
}

/** Remove a watcher. */
export async function deleteWatcher(ticketId, userId) {
  await db.delete(ticketWatchers)
    .where(and(eq(ticketWatchers.ticketId, ticketId), eq(ticketWatchers.userId, userId)));
}

/** Find a ticket by ID scoped to a tenant (for watch access check). */
export async function findTicketInTenant(ticketId, tenantId) {
  const rows = await db
    .select({ id: tickets.id })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(and(eq(tickets.id, ticketId), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}
