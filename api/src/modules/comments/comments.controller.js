import { db } from '../../config/database.js';
import { comments } from './comments.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, ilike } from 'drizzle-orm';
import { logActivity } from '../../utils/activityUtils.js';

const extractMentions = (content) => {
  const matches = content.match(/@(\w[\w\s]*?)(?=\s@|\s*$|[^\w\s])/g) ?? [];
  return matches.map((m) => m.slice(1).trim());
};

export const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const isTenantScopedRole = req.user?.role === 'TENANT_ADMIN' || req.user?.role === 'EMPLOYEE' || req.user?.role === 'PROGRAMMER';
    const tenantId = isTenantScopedRole ? (req.user?.tenantId ?? null) : null;

    if (isTenantScopedRole && !tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

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

    if (
      req.user.role !== 'SUPER_ADMIN' &&
      req.user.role !== 'TENANT_ADMIN' &&
      ticket.assignedToId !== req.user.userId &&
      ticket.createdById !== req.user.userId &&
      ticket.programmerId !== req.user.userId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

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
      .values({ content: content.trim(), ticketId: id, userId: req.user.userId })
      .returning();

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    // Respond immediately — don't wait for notifications
    res.status(201).json({ ...comment, user });

    // Fire notifications async after response
    (async () => {
      try {
        const mentionedNames = extractMentions(content.trim());

        await logActivity({
          ticketId: id,
          userId: req.user.userId,
          action: 'COMMENTED',
          description: 'Commented on ticket',
          newValue: content.trim().substring(0, 100),
        });

        const notificationPayload = {
          type: 'COMMENT_ADDED',
          data: {
            ticket: { id: ticket.id, title: ticket.title },
            commentBy: user?.name,
            comment: content.trim().substring(0, 100),
            mentionedUsers: mentionedNames,
          },
        };

        if (tenantId) {
          const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId));
          tenantUsers.forEach(({ id: uid }) => req.emitNotification(uid, notificationPayload));
        } else {
          req.emitNotification('broadcast', notificationPayload);
        }

        if (mentionedNames.length > 0) {
          const allTenantUsers = tenantId
            ? await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.tenantId, tenantId))
            : await db.select({ id: users.id, name: users.name }).from(users);
          const mentionedIds = allTenantUsers
            .filter((u) => mentionedNames.some((n) => u.name.toLowerCase() === n.toLowerCase()))
            .map((u) => u.id)
            .filter((uid) => uid !== req.user.userId);
          if (mentionedIds.length > 0) {
            const mentionPayload = {
              type: 'COMMENT_MENTION',
              data: {
                ticket: { id: ticket.id, title: ticket.title },
                mentionedBy: user?.name,
                comment: content.trim().substring(0, 100),
              },
            };
            mentionedIds.forEach((uid) => req.emitNotification(uid, mentionPayload));
          }
        }
      } catch (e) {
        console.error('Notification error after comment:', e);
      }
    })();

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

    const isTenantScopedRole = req.user?.role === 'TENANT_ADMIN' || req.user?.role === 'EMPLOYEE' || req.user?.role === 'PROGRAMMER';
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
