import { db } from '../../../config/database.js';
import { epicActivity } from './epicActivity.schema.js';
import { users } from '../../users/users.schema.js';
import { eq, desc } from 'drizzle-orm';

export const logEpicActivity = async (epicId, userId, action, meta = {}) => {
  try {
    await db.insert(epicActivity).values({ epicId, userId: userId || null, action, meta });
  } catch (err) {
    console.error('logEpicActivity error:', err);
  }
};

export const listEpicActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select({
        id:        epicActivity.id,
        action:    epicActivity.action,
        meta:      epicActivity.meta,
        createdAt: epicActivity.createdAt,
        userId:    epicActivity.userId,
        userName:  users.name,
      })
      .from(epicActivity)
      .leftJoin(users, eq(epicActivity.userId, users.id))
      .where(eq(epicActivity.epicId, id))
      .orderBy(desc(epicActivity.createdAt))
      .limit(50);
    res.json(rows.map((r) => ({ id: r.id, action: r.action, meta: r.meta, createdAt: r.createdAt, user: r.userId ? { id: r.userId, name: r.userName } : null })));
  } catch (err) {
    console.error('listEpicActivity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
