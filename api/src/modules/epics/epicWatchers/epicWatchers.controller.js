import { db } from '../../../config/database.js';
import { epicWatchers } from './epicWatchers.schema.js';
import { users } from '../../users/users.schema.js';
import { notifications } from '../../notifications/notifications.schema.js';
import { eq, and, ne } from 'drizzle-orm';

// GET /epics/:id/watchers
export const getEpicWatchers = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(epicWatchers)
      .innerJoin(users, eq(epicWatchers.userId, users.id))
      .where(eq(epicWatchers.epicId, id));
    res.json(rows);
  } catch (e) {
    console.error('getEpicWatchers error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /epics/:id/watch
export const watchEpic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await db.insert(epicWatchers).values({ epicId: id, userId }).onConflictDoNothing();
    res.json({ watching: true });
  } catch (e) {
    console.error('watchEpic error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /epics/:id/watch
export const unwatchEpic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await db.delete(epicWatchers).where(
      and(eq(epicWatchers.epicId, id), eq(epicWatchers.userId, userId))
    );
    res.json({ watching: false });
  } catch (e) {
    console.error('unwatchEpic error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper: notify all watchers of an epic (call from epic updates/comments)
export const notifyEpicWatchers = async (epicId, excludeUserId, payload, emitFn) => {
  try {
    const watchers = await db
      .select({ userId: epicWatchers.userId })
      .from(epicWatchers)
      .where(
        excludeUserId
          ? and(eq(epicWatchers.epicId, epicId), ne(epicWatchers.userId, excludeUserId))
          : eq(epicWatchers.epicId, epicId)
      );

    for (const w of watchers) {
      try {
        const [notification] = await db.insert(notifications).values({
          userId:   w.userId,
          ticketId: null,
          type:     payload.type ?? 'EPIC_UPDATED',
          title:    payload.title,
          message:  payload.message,
        }).returning();
        if (emitFn) {
          emitFn(w.userId, {
            id:        notification.id,
            type:      notification.type,
            title:     notification.title,
            message:   notification.message,
            timestamp: notification.createdAt,
            data:      payload.data ?? {},
          });
        }
      } catch (e) {
        console.error('notifyEpicWatchers insert error:', e);
      }
    }
  } catch (e) {
    console.error('notifyEpicWatchers error:', e);
  }
};
