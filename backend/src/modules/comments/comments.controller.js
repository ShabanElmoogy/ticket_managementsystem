import { db } from '../../config/database.js';
import { comments } from './comments.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '../../utils/activityUtils.js';

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

    // Log activity so it appears in the activity feed
    await logActivity({
      ticketId: id,
      userId: req.user.userId,
      action: 'COMMENTED',
      description: `Commented on ticket`,
      newValue: content.trim().substring(0, 100),
    });

    // Emit notification to all tenant users so their activity feeds refresh
    const notificationPayload = {
      type: 'COMMENT_ADDED',
      data: {
        ticket: { id: ticket.id, title: ticket.title },
        commentBy: user?.name
      }
    };

    if (tenantId) {
      const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId));
      tenantUsers.forEach(({ id: uid }) => req.emitNotification(uid, notificationPayload));
    } else {
      req.emitNotification('broadcast', notificationPayload);
    }

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a comment (owner only)
export const deleteComment = async (req, res) => {
  try {
    const { id: ticketId, commentId } = req.params;

    const [comment] = await db
      .select({ id: comments.id, userId: comments.userId, ticketId: comments.ticketId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user.userId) return res.status(403).json({ error: 'Access denied' });

    await db.delete(comments).where(eq(comments.id, commentId));

    const [ticket] = await db.select({ title: tickets.title }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    const [actor] = await db.select({ name: users.name, tenantId: users.tenantId }).from(users).where(eq(users.id, req.user.userId)).limit(1);

    await logActivity({
      ticketId,
      userId: req.user.userId,
      action: 'COMMENT_DELETED',
      description: 'Deleted a comment',
    });

    const notificationPayload = {
      type: 'COMMENT_DELETED',
      data: {
        ticket: { id: ticketId, title: ticket?.title },
        commentBy: actor?.name,
      },
    };

    const isTenantScopedRole = req.user?.role === 'TENANT_ADMIN' || req.user?.role === 'EMPLOYEE';
    const tenantId = isTenantScopedRole ? (req.user?.tenantId ?? null) : null;

    if (tenantId) {
      const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId));
      tenantUsers.forEach(({ id: uid }) => req.emitNotification(uid, notificationPayload));
    } else {
      req.emitNotification('broadcast', notificationPayload);
    }

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
