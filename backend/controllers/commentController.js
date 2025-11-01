import { db } from '../config/database.js';
import { comments, tickets, users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

// Create new comment on a ticket
export const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if ticket exists and user has access
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user.role !== 'ADMIN' &&
        ticket.assignedToId !== req.user.userId &&
        ticket.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [comment] = await db.insert(comments).values({
      content,
      ticketId: id,
      userId: req.user.userId
    }).returning();

    // Get user data for the response
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email
    }).from(users).where(eq(users.id, req.user.userId)).limit(1);

    const commentWithUser = {
      ...comment,
      user
    };

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
        comment: commentWithUser,
        ticket: { id: ticket.id, title: ticket.title },
        message: `New comment on: ${ticket.title}`,
        commentBy: user.name
      }, targetUsers);
    }

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};