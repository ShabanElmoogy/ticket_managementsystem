/**
 * comments.service.js
 * Business logic for the comments module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import { logActivity } from '../../utils/activityUtils.js';
import * as repo from './comments.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Mention parsing ───────────────────────────────────────────────────────────

function extractMentions(content) {
  // Matches @word — single token, no spaces, stops at non-word character
  const matches = content.match(/@(\w+)/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

// ── Tenant scope helper ───────────────────────────────────────────────────────

function isTenantScoped(role) {
  return role === 'TENANT_ADMIN' || role === 'EMPLOYEE' || role === 'PROGRAMMER';
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function createComment(ticketId, content, user, emitNotification) {
  // Validate content at service level
  if (!content || typeof content !== 'string') throw fail('Content is required', 400);
  const trimmed = content.trim();
  if (!trimmed) throw fail('Content cannot be empty', 400);

  const tenantId = isTenantScoped(user.role) ? (user.tenantId ?? null) : null;
  const safeEmit = typeof emitNotification === 'function' ? emitNotification : () => {};

  if (isTenantScoped(user.role) && !tenantId) {
    throw fail('Tenant context required', 403);
  }

  // Verify ticket access
  const ticket = tenantId
    ? await repo.findTicketInTenant(ticketId, tenantId)
    : await repo.findTicketById(ticketId);

  if (!ticket) throw fail('Ticket not found', 404);

  // Access control — only ticket participants or admins can comment
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'TENANT_ADMIN';
  const isParticipant =
    ticket.assignedToId === user.userId ||
    ticket.createdById  === user.userId ||
    ticket.programmerId === user.userId;

  if (!isAdmin && !isParticipant) throw fail('Access denied', 403);

  // Verify commenter belongs to tenant
  if (tenantId) {
    const member = await repo.findUserInTenant(user.userId, tenantId);
    if (!member) throw fail('Access denied', 403);
  }

  // Insert comment
  const comment    = await repo.insertComment({ content: trimmed, ticketId, userId: user.userId });
  const commentUser = await repo.findUserById(user.userId);

  // Fire-and-forget: activity log + notifications
  (async () => {
    try {
      await logActivity({
        ticketId,
        userId:      user.userId,
        action:      'COMMENTED',
        description: 'Commented on ticket',
        newValue:    trimmed.substring(0, 100),
      });

      // Broadcast COMMENT_ADDED to all tenant users
      const commentPayload = {
        type: 'COMMENT_ADDED',
        data: {
          ticket:        { id: ticket.id, title: ticket.title },
          commentBy:     commentUser?.name,
          comment:       trimmed.substring(0, 100),
          mentionedUsers: extractMentions(trimmed),
        },
      };

      if (tenantId) {
        const ids = await repo.findTenantUserIds(tenantId);
        ids.forEach((uid) => safeEmit(uid, commentPayload));
      } else {
        safeEmit('broadcast', commentPayload);
      }

      // Send COMMENT_MENTION to each mentioned user
      const mentionedNames = extractMentions(trimmed);
      if (mentionedNames.length > 0) {
        const allUsers    = await repo.findUsersForMentions(tenantId);
        const mentionedIds = allUsers
          .filter((u) => mentionedNames.some((n) => u.name.toLowerCase() === n.toLowerCase()))
          .map((u) => u.id)
          .filter((uid) => uid !== user.userId);

        if (mentionedIds.length > 0) {
          const mentionPayload = {
            type: 'COMMENT_MENTION',
            data: {
              ticket:      { id: ticket.id, title: ticket.title },
              mentionedBy: commentUser?.name,
              comment:     trimmed.substring(0, 100),
            },
          };
          mentionedIds.forEach((uid) => safeEmit(uid, mentionPayload));
        }
      }
    } catch (e) {
      console.error('Notification error after comment:', e);
    }
  })();

  return { ...comment, user: commentUser };
}

export async function deleteComment(ticketId, commentId, user, emitNotification) {
  const safeEmit = typeof emitNotification === 'function' ? emitNotification : () => {};

  // Fetch comment and ticket in parallel
  const [comment, ticket] = await Promise.all([
    repo.findCommentById(commentId),
    repo.findTicketById(ticketId),
  ]);

  if (!comment) throw fail('Comment not found', 404);
  if (!ticket)  throw fail('Ticket not found', 404);

  // Verify comment belongs to this ticket
  if (comment.ticketId !== ticketId) throw fail('Comment not found', 404);

  // Only the comment author or admins can delete
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'TENANT_ADMIN';
  if (!isAdmin && comment.userId !== user.userId) throw fail('Access denied', 403);

  // Fetch actor name before deleting
  const actor = await repo.findUserById(user.userId);

  await repo.deleteCommentById(commentId);

  // Activity log + notification (not fire-and-forget — delete is synchronous)
  await logActivity({
    ticketId,
    userId:      user.userId,
    action:      'COMMENT_DELETED',
    description: 'Deleted a comment',
  });

  const notificationPayload = {
    type: 'COMMENT_DELETED',
    data: {
      ticket:    { id: ticketId, title: ticket.title },
      commentBy: actor?.name,
    },
  };

  const tenantId = isTenantScoped(user.role) ? (user.tenantId ?? null) : null;

  if (tenantId) {
    const ids = await repo.findTenantUserIds(tenantId);
    ids.forEach((uid) => safeEmit(uid, notificationPayload));
  } else {
    safeEmit('broadcast', notificationPayload);
  }

  return { message: 'Comment deleted' };
}
