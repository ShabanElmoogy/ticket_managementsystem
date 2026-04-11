import { db } from '../../../config/database.js';
import { epicComments } from './epicComments.schema.js';
import { notifications } from '../../notifications/notifications.schema.js';
import { users } from '../../users/users.schema.js';
import { eq, desc } from 'drizzle-orm';
import { notifyEpicWatchers } from '../epicWatchers/epicWatchers.controller.js';

/** Find mentioned user IDs by checking if content contains @name for each known user. */
const findMentionedIds = (content, allUsers, excludeId) => {
  const lower = content.toLowerCase();
  return allUsers
    .filter((u) => lower.includes(`@${u.name.toLowerCase()}`))
    .map((u) => u.id)
    .filter((id) => id !== excludeId);
};

export const listEpicComments = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select({ id: epicComments.id, content: epicComments.content, createdAt: epicComments.createdAt, userId: epicComments.userId, userName: users.name, userEmail: users.email })
      .from(epicComments)
      .leftJoin(users, eq(epicComments.userId, users.id))
      .where(eq(epicComments.epicId, id))
      .orderBy(desc(epicComments.createdAt));
    res.json(rows.map((r) => ({ id: r.id, content: r.content, createdAt: r.createdAt, user: { id: r.userId, name: r.userName, email: r.userEmail } })));
  } catch (err) {
    console.error('listEpicComments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEpicComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content is required' });
    const [row] = await db.insert(epicComments).values({ content: content.trim(), epicId: id, userId: req.user.userId }).returning();
    const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, req.user.userId)).limit(1);
    res.status(201).json({ ...row, user });

    // Fire mention + watcher notifications async
    (async () => {
      try {
        if (!req.emitNotification) return;
        const allUsers = await db.select({ id: users.id, name: users.name }).from(users);

        // Mention notifications
        const mentionedIds = findMentionedIds(content.trim(), allUsers, req.user.userId);
        for (const uid of mentionedIds) {
          const [notification] = await db.insert(notifications).values({
            userId:   uid,
            ticketId: null,
            type:     'COMMENT_MENTION',
            title:    'You were mentioned',
            message:  `${user?.name} mentioned you in an epic comment: ${content.trim().substring(0, 80)}`,
          }).returning();
          req.emitNotification(uid, {
            id:        notification.id,
            type:      'COMMENT_MENTION',
            title:     notification.title,
            message:   notification.message,
            timestamp: notification.createdAt,
            data: { mentionedBy: user?.name, comment: content.trim().substring(0, 100) },
          });
        }

        // Watcher notifications (exclude commenter and already-mentioned users)
        const excludeIds = new Set([req.user.userId, ...mentionedIds]);
        await notifyEpicWatchers(id, req.user.userId, {
          type:    'EPIC_COMMENT',
          title:   'New comment on epic',
          message: `${user?.name} commented: ${content.trim().substring(0, 80)}`,
          data:    { epicId: id, commentBy: user?.name },
        }, (uid, payload) => {
          if (!excludeIds.has(uid)) req.emitNotification(uid, payload);
        });
      } catch (e) {
        console.error('Epic comment notification error:', e);
      }
    })();
  } catch (err) {
    console.error('createEpicComment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEpicComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const [comment] = await db.select({ id: epicComments.id, userId: epicComments.userId }).from(epicComments).where(eq(epicComments.id, commentId)).limit(1);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user.userId && req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN')
      return res.status(403).json({ error: 'Access denied' });
    await db.delete(epicComments).where(eq(epicComments.id, commentId));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteEpicComment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
