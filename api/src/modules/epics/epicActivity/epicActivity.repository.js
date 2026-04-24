/**
 * epicActivity.repository.js
 * All database queries for the epic activity module.
 */

import { db } from '../../../config/database.js';
import { epicActivity } from './epicActivity.schema.js';
import { users } from '../../users/users.schema.js';
import { eq, desc } from 'drizzle-orm';

/** Insert an activity row. Silently ignores errors (fire-and-forget safe). */
export async function insertActivity(epicId, userId, action, meta = {}) {
  await db.insert(epicActivity).values({ epicId, userId: userId || null, action, meta });
}

/** List recent activity for an epic, joined with actor name. */
export async function findActivityByEpicId(epicId, limit = 50) {
  return db
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
    .where(eq(epicActivity.epicId, epicId))
    .orderBy(desc(epicActivity.createdAt))
    .limit(limit);
}
