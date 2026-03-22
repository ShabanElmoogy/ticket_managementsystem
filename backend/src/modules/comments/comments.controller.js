import { db } from '../../config/database.js';
import { comments } from './comments.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and } from 'drizzle-orm';

// Create new comment on a ticket
export const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Tenant scoping:
    // Tickets table has no tenantId, so we scope via the ticket creator's user.tenantId.
    // - SUPER_ADMIN: no tenant restriction
    // - TENANT_ADMIN / EMPLOYEE: must have tenantId and ticket must belong to that tenant
    const isTenantScopedRole = req.user?.role === 'TENANT_ADMIN' || req.user?.role === 'EMPLOYEE';
    const tenantId = isTenantScopedRole ? (req.user?.tenantId ?? null) : null;

    if (isTenantScopedRole && !tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Check if ticket exists and user has access
    let ticket;
    if (isTenantScopedRole) {
      const rows = await db
        .select({ ticket: tickets })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, id), eq(users.tenantId, tenantId)))
        .limit(1);

      ticket = rows[0]?.ticket;
    } else {
      const rows = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
      ticket = rows[0];
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Authorization:
    // - SUPER_ADMIN: always allowed
    // - TENANT_ADMIN: allowed for any ticket in tenant (already scoped above)
    // - EMPLOYEE: only if assigned to them or created by them
    if (
      req.user.role !== 'SUPER_ADMIN' &&
      req.user.role !== 'TENANT_ADMIN' &&
      ticket.assignedToId !== req.user.userId &&
      ticket.createdById !== req.user.userId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Defense-in-depth: ensure commenting user belongs to tenant
    if (isTenantScopedRole) {
      const [commentingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, req.user.userId), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!commentingUser) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [comment] = await db
      .insert(comments)
      .values({
        content: content.trim(),
        ticketId: id,
        userId: req.user.userId
      })
      .returning();

    // Get user data for the response
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    const commentWithUser = {
      ...comment,
      user
    };

    // Emit real-time notification for new comment
    const targetUsers = [];
    if (ticket.assignedToId) {
      targetUsers.push(ticket.assignedToId);
    }
    if (ticket.createdById && ticket.createdById !== ticket.assignedToId) {
      targetUsers.push(ticket.createdById);
    }

    if (targetUsers.length > 0) {
      targetUsers.forEach((userId) => {
        req.emitNotification(userId, {
          type: 'COMMENT_ADDED',
          data: {
            comment: commentWithUser,
            ticket: { id: ticket.id, title: ticket.title },
            commentBy: user?.name
          }
        });
      });
    }

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
