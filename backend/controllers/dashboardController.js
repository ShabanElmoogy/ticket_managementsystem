import { prisma } from '../config/database.js';

// Get dashboard statistics
export const getStats = async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { assignedToId: req.user.userId };

    const [totalTickets, openTickets, inProgressTickets, resolvedTickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: 'OPEN' } }),
      prisma.ticket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } })
    ]);

    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets
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
    
    // Get recent tickets (created, updated)
    const recentTickets = await prisma.ticket.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Get recent comments
    const recentComments = await prisma.comment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        ticket: {
          select: { id: true, title: true, priority: true, status: true }
        }
      }
    });

    // Combine and format activities
    const activities = [];

    // Add ticket activities
    recentTickets.forEach(ticket => {
      // Check if ticket was recently created (within last hour of update)
      const timeDiff = new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime();
      const isNewTicket = timeDiff < 60000; // 1 minute threshold

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
            createdBy: ticket.createdBy.name
          },
          timestamp: ticket.createdAt
        });
      } else if (ticket.assignedTo) {
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
            assignedTo: ticket.assignedTo.name
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
            updatedBy: ticket.createdBy.name // This could be improved with actual updater tracking
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
          ticket: comment.ticket,
          commentBy: comment.user.name
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