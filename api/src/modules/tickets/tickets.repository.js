/**
 * tickets.repository.js
 * All database queries for the tickets module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { tickets, ticketActivities } from './tickets.schema.js';
import { users } from '../users/users.schema.js';
import { customers } from '../customers/customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { ticketLabels, labels } from '../labels/labels.schema.js';
import { comments } from '../comments/comments.schema.js';
import {
  eq, and, or, desc, asc, count, inArray, isNull, isNotNull, lt, ilike,
} from 'drizzle-orm';

// ── Shared ticket column selection ────────────────────────────────────────────

const TICKET_COLUMNS = {
  id:             tickets.id,
  title:          tickets.title,
  description:    tickets.description,
  status:         tickets.status,
  priority:       tickets.priority,
  dueDate:        tickets.dueDate,
  estimatedHours: tickets.estimatedHours,
  actualHours:    tickets.actualHours,
  createdAt:      tickets.createdAt,
  updatedAt:      tickets.updatedAt,
  customerId:     tickets.customerId,
  applicationId:  tickets.applicationId,
  createdById:    tickets.createdById,
  assignedToId:   tickets.assignedToId,
  programmerId:   tickets.programmerId,
  boardId:        tickets.boardId,
  deletedAt:      tickets.deletedAt,
  slaDeadline:    tickets.slaDeadline,
  emailFrom:      tickets.emailFrom,
  emailMessageId: tickets.emailMessageId,
  epicId:         tickets.epicId,
};

// ── Ticket queries ────────────────────────────────────────────────────────────

/**
 * List tickets with filters and tenant scoping.
 * Joins createdBy user for tenant scoping (tickets have no tenantId column).
 * Returns raw ticket rows — relations are fetched separately.
 */
export async function findTickets({ conditions = [] } = {}) {
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select(TICKET_COLUMNS)
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(whereClause)
    .orderBy(desc(tickets.createdAt));

  // Drizzle returns joined rows — normalize to ticket projection only
  return rows.map((r) => ({
    id:             r.id,
    title:          r.title,
    description:    r.description,
    status:         r.status,
    priority:       r.priority,
    dueDate:        r.dueDate,
    estimatedHours: r.estimatedHours,
    actualHours:    r.actualHours,
    createdAt:      r.createdAt,
    updatedAt:      r.updatedAt,
    customerId:     r.customerId,
    applicationId:  r.applicationId,
    createdById:    r.createdById,
    assignedToId:   r.assignedToId,
    programmerId:   r.programmerId,
    boardId:        r.boardId,
    deletedAt:      r.deletedAt,
    slaDeadline:    r.slaDeadline,
    emailFrom:      r.emailFrom,
    emailMessageId: r.emailMessageId,
    epicId:         r.epicId,
  }));
}

/** Find a ticket by ID scoped to a tenant (via createdBy user join). */
export async function findTicketInTenant(ticketId, tenantId) {
  const rows = await db
    .select({ ticket: tickets })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(and(eq(tickets.id, ticketId), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0]?.ticket ?? null;
}

/** Find a ticket by ID (global — no tenant scope). */
export async function findTicketById(ticketId) {
  const rows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  return rows[0] ?? null;
}

/** Find minimal ticket fields for access control checks. */
export async function findTicketMeta(ticketId, tenantId) {
  if (tenantId) {
    const rows = await db
      .select({ id: tickets.id, assignedToId: tickets.assignedToId, programmerId: tickets.programmerId, status: tickets.status, title: tickets.title, createdById: tickets.createdById })
      .from(tickets)
      .innerJoin(users, eq(tickets.createdById, users.id))
      .where(and(eq(tickets.id, ticketId), eq(users.tenantId, tenantId)))
      .limit(1);
    return rows[0] ?? null;
  }
  const rows = await db
    .select({ id: tickets.id, assignedToId: tickets.assignedToId, programmerId: tickets.programmerId, status: tickets.status, title: tickets.title, createdById: tickets.createdById })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a new ticket, returns the created row. */
export async function insertTicket(values) {
  const [row] = await db.insert(tickets).values(values).returning();
  return row;
}

/** Update a ticket by ID, returns the updated row. */
export async function updateTicketById(ticketId, data) {
  const [row] = await db
    .update(tickets)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tickets.id, ticketId))
    .returning();
  return row ?? null;
}

/** Bulk update status for multiple tickets. */
export async function bulkUpdateTicketStatus(ids, status) {
  await db.update(tickets)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : { resolvedAt: null }),
    })
    .where(inArray(tickets.id, ids));
}

/** Soft-delete a ticket (set deletedAt). */
export async function softDeleteTicket(ticketId) {
  await db.update(tickets).set({ deletedAt: new Date() }).where(eq(tickets.id, ticketId));
}

/** Restore a soft-deleted ticket (clear deletedAt). */
export async function restoreTicket(ticketId) {
  await db.update(tickets).set({ deletedAt: null }).where(eq(tickets.id, ticketId));
}

// ── Batch relation queries (no N+1) ───────────────────────────────────────────

/** Fetch users by IDs. */
export async function findUsersByIds(ids) {
  if (!ids.length) return [];
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, ids));
}

/** Fetch customers by IDs. */
export async function findCustomersByIds(ids) {
  if (!ids.length) return [];
  return db
    .select({ id: customers.id, name: customers.name, email: customers.email, maintenanceType: customers.maintenanceType, subscriptionStartDate: customers.subscriptionStartDate, subscriptionEndDate: customers.subscriptionEndDate })
    .from(customers)
    .where(inArray(customers.id, ids));
}

/** Fetch applications by IDs. */
export async function findApplicationsByIds(ids) {
  if (!ids.length) return [];
  return db
    .select({ id: applications.id, name: applications.name, version: applications.version })
    .from(applications)
    .where(inArray(applications.id, ids));
}

/** Fetch labels for a set of ticket IDs. */
export async function findLabelsByTicketIds(ticketIds) {
  if (!ticketIds.length) return [];
  return db
    .select({
      ticketId: ticketLabels.ticketId,
      label: { id: labels.id, name: labels.name, color: labels.color, description: labels.description },
    })
    .from(ticketLabels)
    .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
    .where(inArray(ticketLabels.ticketId, ticketIds));
}

/** Fetch comment counts for a set of ticket IDs. */
export async function findCommentCountsByTicketIds(ticketIds) {
  if (!ticketIds.length) return [];
  return db
    .select({ ticketId: comments.ticketId, count: count() })
    .from(comments)
    .where(inArray(comments.ticketId, ticketIds))
    .groupBy(comments.ticketId);
}

/** Fetch full comments for a single ticket. */
export async function findCommentsByTicketId(ticketId) {
  return db
    .select({
      id:        comments.id,
      content:   comments.content,
      createdAt: comments.createdAt,
      userId:    comments.userId,
      ticketId:  comments.ticketId,
      user:      { id: users.id, name: users.name, email: users.email },
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.ticketId, ticketId))
    .orderBy(asc(comments.createdAt));
}

/** Fetch recent activities for a single ticket. */
export async function findActivitiesByTicketId(ticketId, limit = 20) {
  return db
    .select({
      id:          ticketActivities.id,
      action:      ticketActivities.action,
      description: ticketActivities.description,
      oldValue:    ticketActivities.oldValue,
      newValue:    ticketActivities.newValue,
      createdAt:   ticketActivities.createdAt,
      userId:      ticketActivities.userId,
      ticketId:    ticketActivities.ticketId,
      user:        { id: users.id, name: users.name, email: users.email },
    })
    .from(ticketActivities)
    .innerJoin(users, eq(ticketActivities.userId, users.id))
    .where(eq(ticketActivities.ticketId, ticketId))
    .orderBy(desc(ticketActivities.createdAt))
    .limit(limit);
}

/** Insert ticket-label assignments. */
export async function insertTicketLabels(ticketId, labelIds) {
  if (!labelIds.length) return;
  await db.insert(ticketLabels).values(labelIds.map((labelId) => ({ ticketId, labelId })));
}

// ── User / tenant helpers ─────────────────────────────────────────────────────

/** Find a user by ID (minimal). */
export async function findUserById(userId) {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, tenantId: users.tenantId })
    .from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}

/** Verify a user belongs to a tenant. */
export async function findUserInTenant(userId, tenantId) {
  const rows = await db
    .select({ id: users.id, tenantId: users.tenantId })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Get all user IDs in a tenant (for broadcast notifications). */
export async function findTenantUserIds(tenantId) {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId));
  return rows.map((r) => r.id);
}

// ── Delayed tickets ───────────────────────────────────────────────────────────

/** Find delayed tickets for a user, optionally tenant-scoped. */
export async function findDelayedTickets(userId, tenantId) {
  const now = new Date();
  const baseConditions = [
    eq(tickets.assignedToId, userId),
    or(and(isNull(tickets.dueDate), eq(tickets.status, 'OPEN')), lt(tickets.dueDate, now)),
    or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS')),
  ];

  const rows = tenantId
    ? await db
        .select(TICKET_COLUMNS)
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(...baseConditions, eq(users.tenantId, tenantId)))
        .orderBy(asc(tickets.dueDate))
    : await db
        .select(TICKET_COLUMNS)
        .from(tickets)
        .where(and(...baseConditions))
        .orderBy(asc(tickets.dueDate));

  // Normalize joined rows
  return rows.map((r) => r.ticket ?? r);
}
