/**
 * epicComments.repository.js
 * All database queries for the epic comments module.
 */

import { db } from '../../../config/database.js';
import { epicComments } from './epicComments.schema.js';
import { notifications } from '../../notifications/notifications.schema.js';
import { users } from '../../users/users.schema.js';
import { eq, desc } from 'drizzle-orm';

/** List all comments for an epic, joined with author info. */
export async function findCommentsByEpicId(epicId) {
  return db
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
    .where(eq(epicComments.epicId, epicId))
    .orderBy(desc(epicComments.createdAt));
}

/** Find a comment by ID (minimal). */
export async function findCommentById(commentId) {
  const rows = await db
    .select({ id: epicComments.id, userId: epicComments.userId })
    .from(epicComments)
    .where(eq(epicComments.id, commentId))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a comment, returns the created row. */
export async function insertComment(epicId, userId, content) {
  const [row] = await db
    .insert(epicComments)
    .values({ content, epicId, userId })
    .returning();
  return row;
}

/** Delete a comment by ID. */
export async function deleteCommentById(commentId) {
  await db.delete(epicComments).where(eq(epicComments.id, commentId));
}

/** Fetch all users (id + name) for mention resolution. */
export async function findAllUsers() {
  return db.select({ id: users.id, name: users.name }).from(users);
}

/** Find a user by ID (for notification payloads). */
export async function findUserById(userId) {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a notification row, returns the created row. */
export async function insertNotification(values) {
  const [row] = await db.insert(notifications).values(values).returning();
  return row;
}
