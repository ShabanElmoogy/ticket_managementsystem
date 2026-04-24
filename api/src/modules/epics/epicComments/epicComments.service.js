/**
 * epicComments.service.js
 * Business logic for epic comments.
 */

import * as repo from './epicComments.repository.js';
import { notifyEpicWatchers } from '../epicWatchers/epicWatchers.service.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Mention detection ─────────────────────────────────────────────────────────

function findMentionedIds(content, allUsers, excludeId) {
  const lower = content.toLowerCase();
  return allUsers
    .filter((u) => lower.includes(`@${u.name.toLowerCase()}`))
    .map((u) => u.id)
    .filter((id) => id !== excludeId);
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listComments(epicId) {
  const rows = await repo.findCommentsByEpicId(epicId);
  return rows.map((r) => ({
    id:        r.id,
    content:   r.content,
    createdAt: r.createdAt,
    user:      { id: r.userId, name: r.userName, email: r.userEmail },
  }));
}

export async function createComment(epicId, content, actorId, safeEmit) {
  if (!content?.trim()) throw fail('content is required');

  const row  = await repo.insertComment(epicId, actorId, content.trim());
  const user = await repo.findUserById(actorId);

  // Fire-and-forget: mention + watcher notifications
  if (safeEmit) {
    (async () => {
      try {
        const allUsers     = await repo.findAllUsers();
        const mentionedIds = findMentionedIds(content.trim(), allUsers, actorId);

        for (const uid of mentionedIds) {
          const notification = await repo.insertNotification({
            userId:   uid,
            ticketId: null,
            type:     'COMMENT_MENTION',
            title:    'You were mentioned',
            message:  `${user?.name} mentioned you in an epic comment: ${content.trim().substring(0, 80)}`,
          });
          safeEmit(uid, {
            id:        notification.id,
            type:      'COMMENT_MENTION',
            title:     notification.title,
            message:   notification.message,
            timestamp: notification.createdAt,
            data:      { mentionedBy: user?.name, comment: content.trim().substring(0, 100) },
          });
        }

        const excludeIds = new Set([actorId, ...mentionedIds]);
        await notifyEpicWatchers(epicId, actorId, {
          type:    'EPIC_COMMENT',
          title:   'New comment on epic',
          message: `${user?.name} commented: ${content.trim().substring(0, 80)}`,
          data:    { epicId, commentBy: user?.name },
        }, (uid, payload) => {
          if (!excludeIds.has(uid)) safeEmit(uid, payload);
        });
      } catch (e) {
        console.error('Epic comment notification error:', e);
      }
    })();
  }

  return { ...row, user };
}

export async function deleteComment(commentId, actorId, actorRole) {
  const comment = await repo.findCommentById(commentId);
  if (!comment) throw fail('Comment not found', 404);

  const isAdmin = actorRole === 'TENANT_ADMIN' || actorRole === 'SUPER_ADMIN';
  if (comment.userId !== actorId && !isAdmin) throw fail('Access denied', 403);

  await repo.deleteCommentById(commentId);
  return { message: 'Deleted' };
}
