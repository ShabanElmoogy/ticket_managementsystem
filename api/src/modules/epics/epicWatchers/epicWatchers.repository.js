/**
 * epicWatchers.repository.js
 * All database queries for the epic watchers module.
 */

import { db } from '../../../config/database.js';
import { epicWatchers } from './epicWatchers.schema.js';
import { notifications } from '../../notifications/notifications.schema.js';
import { users } from '../../users/users.schema.js';
import { eq, and, ne } from 'drizzle-orm';

/** List all watchers for an epic with user info. */
export async function findWatchersByEpicId(epicId) {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(epicWatchers)
    .innerJoin(users, eq(epicWatchers.userId, users.id))
    .where(eq(epicWatchers.epicId, epicId));
}

/** Find watcher IDs for an epic, optionally excluding one user. */
export async function findWatcherIds(epicId, excludeUserId) {
  const rows = await db
    .select({ userId: epicWatchers.userId })
    .from(epicWatchers)
    .where(
      excludeUserId
        ? and(eq(epicWatchers.epicId, epicId), ne(epicWatchers.userId, excludeUserId))
        : eq(epicWatchers.epicId, epicId),
    );
  return rows.map((r) => r.userId);
}

/** Add a watcher (idempotent). */
export async function insertWatcher(epicId, userId) {
  await db.insert(epicWatchers).values({ epicId, userId }).onConflictDoNothing();
}

/** Remove a watcher. */
export async function deleteWatcher(epicId, userId) {
  await db.delete(epicWatchers).where(and(eq(epicWatchers.epicId, epicId), eq(epicWatchers.userId, userId)));
}

/** Insert a notification row, returns the created row. */
export async function insertNotification(values) {
  const [row] = await db.insert(notifications).values(values).returning();
  return row;
}
