import { db } from '../../config/database.js';
import { tickets, ticketActivities } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, count, desc, isNotNull, avg, sql } from 'drizzle-orm';

import { getTenantScope, requireTenantScope } from '../../utils/tenantUtils.js';

// Get dashboard statistics
export const getStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'TENANT_ADMIN';

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    // Tickets table has no tenantId, so for tenant-scoped requests we scope via createdBy user.
    const totalTicketsQuery = isAdmin
      ? tenantId
        ? db
            .select({ count: count() })
            .from(tickets)
            .innerJoin(users, eq(tickets.createdById, users.id))
            .where(eq(users.tenantId, tenantId))
        : db.select({ count: count() }).from(tickets)
      : tenantId
        ? db
            .select({ count: count() })
            .from(tickets)
            .innerJoin(users, eq(tickets.createdById, users.id))
            .where(and(eq(users.tenantId, tenantId), eq(tickets.assignedToId, req.user.userId)))
        : db.select({ count: count() }).from(tickets).where(eq(tickets.assignedToId, req.user.userId));

    const openTicketsQuery = isAdmin
      ? tenantId
        ? db
            .select({ count: count() })
            .from(tickets)
            .innerJoin(users, eq(tickets.createdById, users.id))
            .where(and(eq(users.tenantId, tenantId), eq(tickets.status, 'OPEN')))
        : db.select({ count: count() }).from(tickets).where(eq(tickets.status, 'OPEN'))
      : tenantId
        ? db
            .select({ count: count() })
            .from(tickets)
            .innerJoin(users, eq(tickets.createdById, users.id))
            .where(and(eq(users.tenantId, tenantId), eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'OPEN')))
        : db
            .select({ count: count() })
            .from(tickets)
            .where(and(eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'OPEN')));

    const inProgressTicketsQuery = isAdmin
      ? tenantId
        ? db
            .select({ count: count() })
            .from(tickets)
            .innerJoin(users, eq(tickets.createdById, users.id))
            .where(and(eq(users.tenantId, tenantId), eq(tickets.status, 'IN_PROGRESS')))
        : db.select({ count: count() }).from(tickets).where(eq(tickets.status, 'IN_PROGRESS'))
      : tenantId
        ? db
            .select({ count: count() })
            .from(tickets)
            .innerJoin(users, eq(tickets.createdById, users.id))
            .where(and(eq(users.tenantId, tenantId), eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'IN_PROGRESS')))
        : db
            .select({ count: count() })
            .from(tickets)
            .where(and(eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'IN_PROGRESS')));

    const resolvedTicketsQuery = isAdmin
      ? tenantId
        ? db
            .select({ count: count() })
            .from(tickets)
            .innerJoin(users, eq(tickets.createdById, users.id))
            .where(and(eq(users.tenantId, tenantId), eq(tickets.status, 'RESOLVED')))
        : db.select({ count: count() }).from(tickets).where(eq(tickets.status, 'RESOLVED'))
      : tenantId
        ? db
            .select({ count: count() })
            .from(tickets)
            .innerJoin(users, eq(tickets.createdById, users.id))
            .where(and(eq(users.tenantId, tenantId), eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'RESOLVED')))
        : db
            .select({ count: count() })
            .from(tickets)
            .where(and(eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'RESOLVED')));

    // Avg estimation accuracy: avg(actualHours / estimatedHours) for tickets with both set
    const accuracyBaseQuery = db
      .select({ avgActual: avg(tickets.actualHours), avgEstimated: avg(tickets.estimatedHours) })
      .from(tickets)
      .where(and(isNotNull(tickets.actualHours), isNotNull(tickets.estimatedHours)));

    const [totalTickets, openTickets, inProgressTickets, resolvedTickets, accuracyResult, resolutionResult] = await Promise.all([
      totalTicketsQuery,
      openTicketsQuery,
      inProgressTicketsQuery,
      resolvedTicketsQuery,
      accuracyBaseQuery,
      db
        .select({
          avgMs: sql`AVG(EXTRACT(EPOCH FROM (${tickets.resolvedAt} - ${tickets.createdAt})) * 1000)`,
        })
        .from(tickets)
        .where(and(isNotNull(tickets.resolvedAt), isNotNull(tickets.createdAt))),
    ]);

    const avgResolutionMs = parseFloat(resolutionResult[0]?.avgMs || 0);
    const avgResolutionHours = avgResolutionMs > 0 ? Math.round(avgResolutionMs / 3600000 * 10) / 10 : null;
    const avgActual = parseFloat(accuracyResult[0]?.avgActual || 0);
    const avgEstimated = parseFloat(accuracyResult[0]?.avgEstimated || 0);
    const avgEstimationAccuracy = avgEstimated > 0 ? Math.round((avgActual / avgEstimated) * 100) : null;

    res.json({
      totalTickets: totalTickets[0].count,
      openTickets: openTickets[0].count,
      inProgressTickets: inProgressTickets[0].count,
      resolvedTickets: resolvedTickets[0].count,
      avgEstimationAccuracy,
      avgResolutionHours,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get activity feed
export const getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    // actor = user who performed the action; assignee = user the ticket is assigned to
    const actorUsers = db.select({ id: users.id, name: users.name, tenantId: users.tenantId }).from(users).as('actor_users');
    const assigneeUsers = db.select({ id: users.id, name: users.name }).from(users).as('assignee_users');

    // Build base query for ticket activities joined with ticket, actor user, and assignee user
    const baseQuery = db
      .select({
        id: ticketActivities.id,
        action: ticketActivities.action,
        description: ticketActivities.description,
        newValue: ticketActivities.newValue,
        createdAt: ticketActivities.createdAt,
        ticketId: tickets.id,
        ticketTitle: tickets.title,
        ticketPriority: tickets.priority,
        ticketStatus: tickets.status,
        ticketAssignedToId: tickets.assignedToId,
        userName: actorUsers.name,
        userTenantId: actorUsers.tenantId,
        assignedToName: assigneeUsers.name,
      })
      .from(ticketActivities)
      .innerJoin(tickets, eq(ticketActivities.ticketId, tickets.id))
      .innerJoin(actorUsers, eq(ticketActivities.userId, actorUsers.id))
      .leftJoin(assigneeUsers, eq(tickets.assignedToId, assigneeUsers.id));

    const rows = tenantId
      ? await baseQuery.where(eq(actorUsers.tenantId, tenantId)).orderBy(desc(ticketActivities.createdAt)).limit(limit)
      : await baseQuery.orderBy(desc(ticketActivities.createdAt)).limit(limit);

    // Map action → activity type
    const actionTypeMap = {
      CREATED: 'TICKET_CREATED',
      ASSIGNED: 'TICKET_ASSIGNED',
      REASSIGNED: 'TICKET_ASSIGNED',
      PROGRAMMER_ASSIGNED: 'TICKET_ASSIGNED',
      STATUS_CHANGED: 'TICKET_UPDATED',
      PRIORITY_CHANGED: 'TICKET_UPDATED',
      UPDATED: 'TICKET_UPDATED',
      COMMENTED: 'COMMENT_ADDED',
      COMMENT_DELETED: 'COMMENT_DELETED',
      DELETED: 'TICKET_UPDATED',
      RESTORED: 'TICKET_UPDATED',
      PROGRAMMING_UPDATED: 'TICKET_UPDATED',
    };

    const activities = rows.map((row) => ({
      id: `activity-${row.id}`,
      type: actionTypeMap[row.action] || 'TICKET_UPDATED',
      data: {
        ticket: { id: row.ticketId, title: row.ticketTitle, priority: row.ticketPriority, status: row.ticketStatus },
        createdBy: row.action === 'CREATED' ? row.userName : undefined,
        updatedBy: !['CREATED', 'ASSIGNED', 'REASSIGNED', 'PROGRAMMER_ASSIGNED', 'COMMENTED', 'COMMENT_DELETED'].includes(row.action) ? row.userName : undefined,
        description: row.action === 'UPDATED' ? row.description : undefined,
        assignedTo: (row.action === 'ASSIGNED' || row.action === 'PROGRAMMER_ASSIGNED') ? (row.assignedToName || row.userName) : undefined,
        reassignedTo: row.action === 'REASSIGNED' ? row.description : undefined,
        commentBy: row.action === 'COMMENTED' || row.action === 'COMMENT_DELETED' ? row.userName : undefined,
        newStatus: (row.action === 'STATUS_CHANGED' || row.action === 'UPDATED') ? row.newValue : row.action === 'DELETED' ? 'DELETED' : row.action === 'RESTORED' ? 'RESTORED' : undefined,
      },
      timestamp: row.createdAt,
    }));

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
