import { db } from '../../config/database.js';
import { tickets } from '../tickets/tickets.schema.js';
import { comments } from '../comments/comments.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, count, desc, inArray } from 'drizzle-orm';

const getTenantScope = (req) => {
  // SUPER_ADMIN can operate without tenant scope.
  if (req.user?.role === 'SUPER_ADMIN') return req.tenantId ?? null;
  // Tenant-scoped roles must have a tenant context (resolved header/param or token).
  return req.tenantId ?? req.user?.tenantId ?? null;
};

// Get dashboard statistics
export const getStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'TENANT_ADMIN';

    const tenantId = getTenantScope(req);
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Tenant context required' });
    }

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

    const [totalTickets, openTickets, inProgressTickets, resolvedTickets] = await Promise.all([
      totalTicketsQuery,
      openTicketsQuery,
      inProgressTicketsQuery,
      resolvedTicketsQuery
    ]);

    res.json({
      totalTickets: totalTickets[0].count,
      openTickets: openTickets[0].count,
      inProgressTickets: inProgressTickets[0].count,
      resolvedTickets: resolvedTickets[0].count
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

    const tenantId = getTenantScope(req);
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Get recent tickets with user data
    // Tenant scoping: tickets table has no tenantId, so scope via createdBy user.
    const recentTickets = tenantId
      ? await db
          .select({
            id: tickets.id,
            title: tickets.title,
            priority: tickets.priority,
            status: tickets.status,
            createdAt: tickets.createdAt,
            updatedAt: tickets.updatedAt,
            assignedToId: tickets.assignedToId,
            createdById: tickets.createdById
          })
          .from(tickets)
          .innerJoin(users, eq(tickets.createdById, users.id))
          .where(eq(users.tenantId, tenantId))
          .orderBy(desc(tickets.updatedAt))
          .limit(limit)
      : await db
          .select({
            id: tickets.id,
            title: tickets.title,
            priority: tickets.priority,
            status: tickets.status,
            createdAt: tickets.createdAt,
            updatedAt: tickets.updatedAt,
            assignedToId: tickets.assignedToId,
            createdById: tickets.createdById
          })
          .from(tickets)
          .orderBy(desc(tickets.updatedAt))
          .limit(limit);

    // Get user data for tickets
    const userIds = [
      ...new Set([
        ...recentTickets.map((t) => t.assignedToId).filter(Boolean),
        ...recentTickets.map((t) => t.createdById).filter(Boolean)
      ])
    ];

    const ticketUsers = userIds.length
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email
          })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];

    // Get recent comments with user and ticket data
    // Tenant scoping: scope via ticket creator's tenant.
    // NOTE: we need a second users alias for the ticket creator join.
    const ticketCreator = users;

    const recentComments = tenantId
      ? await db
          .select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            userId: comments.userId,
            ticketId: comments.ticketId,
            userName: users.name,
            userEmail: users.email,
            ticketTitle: tickets.title,
            ticketPriority: tickets.priority,
            ticketStatus: tickets.status
          })
          .from(comments)
          .innerJoin(users, eq(users.id, comments.userId))
          .innerJoin(tickets, eq(tickets.id, comments.ticketId))
          .innerJoin(ticketCreator, eq(tickets.createdById, ticketCreator.id))
          .where(eq(ticketCreator.tenantId, tenantId))
          .orderBy(desc(comments.createdAt))
          .limit(limit)
      : await db
          .select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            userId: comments.userId,
            ticketId: comments.ticketId,
            userName: users.name,
            userEmail: users.email,
            ticketTitle: tickets.title,
            ticketPriority: tickets.priority,
            ticketStatus: tickets.status
          })
          .from(comments)
          .innerJoin(users, eq(users.id, comments.userId))
          .innerJoin(tickets, eq(tickets.id, comments.ticketId))
          .orderBy(desc(comments.createdAt))
          .limit(limit);

    // Combine and format activities
    const activities = [];

    // Add ticket activities
    recentTickets.forEach((ticket) => {
      const timeDiff = new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime();
      const isNewTicket = timeDiff < 60000; // 1 minute threshold
      const createdByUser = ticketUsers.find((u) => u.id === ticket.createdById);
      const assignedToUser = ticketUsers.find((u) => u.id === ticket.assignedToId);

      if (isNewTicket) {
        activities.push({
          id: `ticket-created-${ticket.id}`,
          type: 'TICKET_CREATED',
          data: {
            ticket: {
              id: ticket.id,
              title: ticket.title,
              priority: ticket.priority,
              status: ticket.status
            },
            createdBy: createdByUser?.name || 'Unknown'
          },
          timestamp: ticket.createdAt
        });
      } else if (assignedToUser) {
        activities.push({
          id: `ticket-assigned-${ticket.id}-${ticket.updatedAt}`,
          type: 'TICKET_ASSIGNED',
          data: {
            ticket: {
              id: ticket.id,
              title: ticket.title,
              priority: ticket.priority,
              status: ticket.status
            },
            assignedTo: assignedToUser.name
          },
          timestamp: ticket.updatedAt
        });
      } else {
        activities.push({
          id: `ticket-updated-${ticket.id}-${ticket.updatedAt}`,
          type: 'TICKET_UPDATED',
          data: {
            ticket: {
              id: ticket.id,
              title: ticket.title,
              priority: ticket.priority,
              status: ticket.status
            },
            updatedBy: createdByUser?.name || 'Unknown'
          },
          timestamp: ticket.updatedAt
        });
      }
    });

    // Add comment activities
    recentComments.forEach((comment) => {
      activities.push({
        id: `comment-${comment.id}`,
        type: 'COMMENT_ADDED',
        data: {
          comment: {
            id: comment.id,
            content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
          },
          ticket: {
            id: comment.ticketId,
            title: comment.ticketTitle,
            priority: comment.ticketPriority,
            status: comment.ticketStatus
          },
          commentBy: comment.userName
        },
        timestamp: comment.createdAt
      });
    });

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    res.json(sortedActivities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
