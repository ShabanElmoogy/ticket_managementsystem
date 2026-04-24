/**
 * dashboard.repository.js
 * All database queries for the dashboard module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { tickets, ticketActivities } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, count, desc, isNotNull, avg, sql } from 'drizzle-orm';

// ── Ticket count helpers ──────────────────────────────────────────────────────

/**
 * Build the WHERE conditions for ticket counts based on role + tenant scope.
 * Tickets have no tenantId column — scoped via createdBy user.tenantId.
 *
 * @param {object} opts
 * @param {string|null} opts.tenantId
 * @param {boolean}     opts.isAdmin
 * @param {string|null} opts.userId   — null for admin queries
 * @param {string|null} opts.status   — null = all statuses
 */
function buildTicketCountQuery({ tenantId, isAdmin, userId, status }) {
  const conditions = [];
  if (status)   conditions.push(eq(tickets.status, status));
  if (!isAdmin && userId) conditions.push(eq(tickets.assignedToId, userId));

  if (tenantId) {
    // Must join users to scope by tenant
    const where = conditions.length ? and(eq(users.tenantId, tenantId), ...conditions) : eq(users.tenantId, tenantId);
    return db
      .select({ count: count() })
      .from(tickets)
      .innerJoin(users, eq(tickets.createdById, users.id))
      .where(where);
  }

  const where = conditions.length ? and(...conditions) : undefined;
  return db.select({ count: count() }).from(tickets).where(where);
}

/** Fetch all four ticket counts in a single Promise.all. */
export async function getTicketCounts({ tenantId, isAdmin, userId }) {
  const opts = { tenantId, isAdmin, userId };

  const [total, open, inProgress, resolved] = await Promise.all([
    buildTicketCountQuery({ ...opts, status: null }),
    buildTicketCountQuery({ ...opts, status: 'OPEN' }),
    buildTicketCountQuery({ ...opts, status: 'IN_PROGRESS' }),
    buildTicketCountQuery({ ...opts, status: 'RESOLVED' }),
  ]);

  return {
    total:      Number(total[0].count),
    open:       Number(open[0].count),
    inProgress: Number(inProgress[0].count),
    resolved:   Number(resolved[0].count),
  };
}

/** Average estimation accuracy and average resolution time. */
export async function getPerformanceMetrics() {
  const [accuracy, resolution] = await Promise.all([
    db
      .select({ avgActual: avg(tickets.actualHours), avgEstimated: avg(tickets.estimatedHours) })
      .from(tickets)
      .where(and(isNotNull(tickets.actualHours), isNotNull(tickets.estimatedHours))),
    db
      .select({
        avgMs: sql`AVG(EXTRACT(EPOCH FROM (${tickets.resolvedAt} - ${tickets.createdAt})) * 1000)`,
      })
      .from(tickets)
      .where(and(isNotNull(tickets.resolvedAt), isNotNull(tickets.createdAt))),
  ]);

  return { accuracy: accuracy[0], resolution: resolution[0] };
}

// ── Activity feed ─────────────────────────────────────────────────────────────

/**
 * Fetch recent ticket activities, optionally scoped to a tenant.
 * Uses aliased user joins to get both the actor and the assignee name.
 */
export async function findRecentActivities({ tenantId, limit }) {
  const actorUsers   = db.select({ id: users.id, name: users.name, tenantId: users.tenantId }).from(users).as('actor_users');
  const assigneeUsers = db.select({ id: users.id, name: users.name }).from(users).as('assignee_users');

  const baseQuery = db
    .select({
      id:                 ticketActivities.id,
      action:             ticketActivities.action,
      description:        ticketActivities.description,
      newValue:           ticketActivities.newValue,
      createdAt:          ticketActivities.createdAt,
      ticketId:           tickets.id,
      ticketTitle:        tickets.title,
      ticketPriority:     tickets.priority,
      ticketStatus:       tickets.status,
      ticketAssignedToId: tickets.assignedToId,
      userName:           actorUsers.name,
      userTenantId:       actorUsers.tenantId,
      assignedToName:     assigneeUsers.name,
    })
    .from(ticketActivities)
    .innerJoin(tickets,      eq(ticketActivities.ticketId, tickets.id))
    .innerJoin(actorUsers,   eq(ticketActivities.userId,   actorUsers.id))
    .leftJoin(assigneeUsers, eq(tickets.assignedToId,      assigneeUsers.id));

  return tenantId
    ? baseQuery.where(eq(actorUsers.tenantId, tenantId)).orderBy(desc(ticketActivities.createdAt)).limit(limit)
    : baseQuery.orderBy(desc(ticketActivities.createdAt)).limit(limit);
}
