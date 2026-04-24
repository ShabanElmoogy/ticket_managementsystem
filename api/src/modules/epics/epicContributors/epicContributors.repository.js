/**
 * epicContributors.repository.js
 * All database queries for the epic contributors module.
 */

import { db } from '../../../config/database.js';
import { epicContributors } from './epicContributors.schema.js';
import { epics } from '../epics/epics.schema.js';
import { users } from '../../users/users.schema.js';
import { eq } from 'drizzle-orm';

/** List all contributors for an epic with user info. */
export async function findContributorsByEpicId(epicId) {
  return db
    .select({
      id:        epicContributors.id,
      role:      epicContributors.role,
      createdAt: epicContributors.createdAt,
      userId:    users.id,
      userName:  users.name,
      userEmail: users.email,
    })
    .from(epicContributors)
    .innerJoin(users, eq(epicContributors.userId, users.id))
    .where(eq(epicContributors.epicId, epicId))
    .orderBy(epicContributors.createdAt);
}

/** Find a contributor row by ID. */
export async function findContributorById(contributorId) {
  const rows = await db
    .select({ id: epicContributors.id, role: epicContributors.role, createdAt: epicContributors.createdAt })
    .from(epicContributors)
    .where(eq(epicContributors.id, contributorId))
    .limit(1);
  return rows[0] ?? null;
}

/** Find an epic by ID (existence check). */
export async function findEpicById(epicId) {
  const rows = await db.select({ id: epics.id }).from(epics).where(eq(epics.id, epicId)).limit(1);
  return rows[0] ?? null;
}

/** Find a user by ID. */
export async function findUserById(userId) {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Upsert a contributor (insert or update role on conflict). */
export async function upsertContributor(epicId, userId, role) {
  const [row] = await db
    .insert(epicContributors)
    .values({ epicId, userId, role })
    .onConflictDoUpdate({
      target: [epicContributors.epicId, epicContributors.userId],
      set:    { role },
    })
    .returning();
  return row;
}

/** Update a contributor's role by ID. */
export async function updateContributorRole(contributorId, role) {
  const [row] = await db
    .update(epicContributors)
    .set({ role })
    .where(eq(epicContributors.id, contributorId))
    .returning();
  return row ?? null;
}

/** Delete a contributor by ID. */
export async function deleteContributorById(contributorId) {
  await db.delete(epicContributors).where(eq(epicContributors.id, contributorId));
}
