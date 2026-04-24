/**
 * programming.repository.js
 * All database queries for the programming module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { programmingDetails } from './programming.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and } from 'drizzle-orm';

// ── Programming details ───────────────────────────────────────────────────────

/**
 * Find programming details for a ticket, scoped to a tenant.
 * Returns null if not found.
 */
export async function findProgrammingDetails(ticketId, tenantId) {
  const rows = await db
    .select()
    .from(programmingDetails)
    .where(and(eq(programmingDetails.ticketId, ticketId), eq(programmingDetails.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Check whether a programming details row exists for a ticket. */
export async function findProgrammingDetailsMeta(ticketId) {
  const rows = await db
    .select({ id: programmingDetails.id })
    .from(programmingDetails)
    .where(eq(programmingDetails.ticketId, ticketId))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a new programming details row, returns the created row. */
export async function insertProgrammingDetails(values) {
  const [row] = await db.insert(programmingDetails).values(values).returning();
  return row;
}

/** Update an existing programming details row by ticketId, returns the updated row. */
export async function updateProgrammingDetails(ticketId, data) {
  const [row] = await db
    .update(programmingDetails)
    .set(data)
    .where(eq(programmingDetails.ticketId, ticketId))
    .returning();
  return row ?? null;
}

// ── Ticket queries ────────────────────────────────────────────────────────────

/**
 * Find a ticket by ID scoped to a tenant (via createdBy user join).
 * Returns minimal fields needed for access control.
 */
export async function findTicketInTenant(ticketId, tenantId) {
  const rows = await db
    .select({ id: tickets.id, programmerId: tickets.programmerId, title: tickets.title })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(and(eq(tickets.id, ticketId), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Update a ticket's programmerId and status, returns the updated row. */
export async function assignProgrammerToTicket(ticketId, programmerId) {
  const [row] = await db
    .update(tickets)
    .set({ programmerId, status: 'PROGRAMMING', updatedAt: new Date() })
    .where(eq(tickets.id, ticketId))
    .returning();
  return row ?? null;
}

// ── User queries ──────────────────────────────────────────────────────────────

/**
 * Find a user by ID, verifying they belong to the tenant and have PROGRAMMER role.
 * Returns { id, name } or null.
 */
export async function findProgrammerInTenant(programmerId, tenantId) {
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, programmerId), eq(users.tenantId, tenantId), eq(users.role, 'PROGRAMMER')))
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
