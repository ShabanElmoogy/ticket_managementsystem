import { db } from '../../config/database.js';
import { epicComments } from './epicComments.schema.js';
import { users } from '../users/users.schema.js';
import { eq, asc } from 'drizzle-orm';

export const listEpicComments = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select({
        id:        epicComments.id,
        content:   epicComments.content,
        createdAt: epicComments.createdAt,
        userId:    epicComments.userId,
        userName:  users.name,
        userEmail: users.email,
      })
      .from(epicComments)
      .leftJoin(users, eq(epicComments.userId, users.id))
      .where(eq(epicComments.epicId, id))
      .orderBy(asc(epicComments.createdAt));

    res.json(rows.map((r) => ({
      id: r.id, content: r.content, createdAt: r.createdAt,
      user: { id: r.userId, name: r.userName, email: r.userEmail },
    })));
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

    const [row] = await db
      .insert(epicComments)
      .values({ content: content.trim(), epicId: id, userId: req.user.userId })
      .returning();

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(eq(users.id, req.user.userId)).limit(1);

    res.status(201).json({ ...row, user });
  } catch (err) {
    console.error('createEpicComment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEpicComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const [comment] = await db
      .select({ id: epicComments.id, userId: epicComments.userId })
      .from(epicComments).where(eq(epicComments.id, commentId)).limit(1);

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
