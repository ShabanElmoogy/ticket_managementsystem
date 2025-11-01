import { db } from '../config/database.js';
import { tickets, comments, users } from '../drizzle/schema.js';
import { eq, and, count, desc } from 'drizzle-orm';

// Get dashboard statistics
export const getStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    
    const totalTicketsQuery = isAdmin 
      ? db.select({ count: count() }).from(tickets)
      : db.select({ count: count() }).from(tickets).where(eq(tickets.assignedToId, req.user.userId));
    
    const openTicketsQuery = isAdmin
      ? db.select({ count: count() }).from(tickets).where(eq(tickets.status, 'OPEN'))
      : db.select({ count: count() }).from(tickets).where(and(eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'OPEN')));
    
    const inProgressTicketsQuery = isAdmin
      ? db.select({ count: count() }).from(tickets).where(eq(tickets.status, 'IN_PROGRESS'))
      : db.select({ count: count() }).from(tickets).where(and(eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'IN_PROGRESS')));
    
    const resolvedTicketsQuery = isAdmin
      ? db.select({ count: count() }).from(tickets).where(eq(tickets.status, 'RESOLVED'))
      : db.select({ count: count() }).from(tickets).where(and(eq(tickets.assignedToId, req.user.userId), eq(tickets.status, 'RESOLVED')));

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
    
    // Get recent tickets with user data
    const recentTickets = await db
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
    const userIds = [...new Set([
      ...recentTickets.map(t => t.assignedToId).filter(Boolean),
      ...recentTickets.map(t => t.createdById).filter(Boolean)
    ])];
    
    const ticketUsers = userIds.length > 0 ? await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, userIds[0])) // Simplified for single user lookup
      : [];

    // Get recent comments with user and ticket data
    const recentComments = await db
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
    recentTickets.forEach(ticket => {
      const timeDiff = new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime();
      const isNewTicket = timeDiff < 60000; // 1 minute threshold
      const createdByUser = ticketUsers.find(u => u.id === ticket.createdById);
      const assignedToUser = ticketUsers.find(u => u.id === ticket.assignedToId);

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
    recentComments.forEach(comment => {
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