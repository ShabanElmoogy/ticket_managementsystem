/**
 * pushTokens.service.js
 * Business logic for push token registration and deletion.
 * Orchestrates repository calls and enforces ownership rules.
 */

import * as repo from './pushTokens.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * Register (upsert) a push token for the authenticated user.
 * Validates that the token and platform are present.
 *
 * @param {string} userId - Authenticated user ID from JWT
 * @param {string} token  - Expo Push Token string
 * @param {string} platform - 'ios' | 'android'
 */
export async function registerPushToken(userId, token, platform) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw fail('Push token is required');
  }
  if (!platform || !['ios', 'android'].includes(platform)) {
    throw fail('Platform must be "ios" or "android"');
  }

  await repo.upsertPushToken(userId, token.trim(), platform);
  return { message: 'Push token registered successfully' };
}

/**
 * Delete all push tokens for the authenticated user.
 * Called on logout to stop delivering notifications to this device.
 *
 * @param {string} userId - Authenticated user ID from JWT
 */
export async function deletePushTokens(userId) {
  await repo.deleteTokensByUserId(userId);
  return { message: 'Push tokens deleted successfully' };
}
