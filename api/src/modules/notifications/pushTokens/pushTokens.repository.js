/**
 * pushTokens.repository.js
 * All database queries for push token management.
 * No business logic — only data access.
 */

import { db } from '../../../config/database.js';
import { pushTokens } from './pushTokens.schema.js';
import { eq, and } from 'drizzle-orm';

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Upsert a push token for a user.
 * If the token already exists (unique constraint), update the userId and platform.
 * This handles token rotation — same device re-registers with same token.
 */
export async function upsertPushToken(userId, token, platform) {
  const [row] = await db
    .insert(pushTokens)
    .values({ userId, token, platform })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId, platform },
    })
    .returning();
  return row;
}

/**
 * Find all push tokens for a user.
 */
export async function findTokensByUserId(userId) {
  return db
    .select()
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));
}

/**
 * Delete all push tokens for a user (called on logout).
 */
export async function deleteTokensByUserId(userId) {
  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));
}

/**
 * Delete a specific push token by its token string.
 * Used when Expo Push API returns DeviceNotRegistered.
 */
export async function deleteTokenByValue(token) {
  await db.delete(pushTokens).where(eq(pushTokens.token, token));
}
