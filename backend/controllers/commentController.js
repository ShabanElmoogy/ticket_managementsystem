import { prisma } from '../config/database.js';

// Create new comment on a ticket
export const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if ticket exists and user has access
    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user.role !== 'ADMIN' && 
        ticket.assignedToId !== req.user.userId && 
        ticket.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId: id,
        userId: req.user.userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Emit real-time notification for new comment
    const targetUsers = [];
    if (ticket.assignedToId && ticket.assignedToId !== req.user.userId) {
      targetUsers.push(ticket.assignedToId);
    }
    if (ticket.createdById && ticket.createdById !== req.user.userId) {
      targetUsers.push(ticket.createdById);
    }

    if (targetUsers.length > 0) {
      req.emitNotification('COMMENT_ADDED', {
        comment,
        ticket: { id: ticket.id, title: ticket.title },
        message: `New comment on: ${ticket.title}`,
        commentBy: comment.user.name
      }, targetUsers);
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};