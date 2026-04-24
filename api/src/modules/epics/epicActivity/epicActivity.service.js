/**
 * epicActivity.service.js
 * Business logic for epic activity logging and retrieval.
 */

import * as repo from './epicActivity.repository.js';

/**
 * Log an epic activity event.
 * Silently swallows errors — activity logging must never break the main flow.
 */
export async function logEpicActivity(epicId, userId, action, meta = {}) {
  try {
    await repo.insertActivity(epicId, userId, action, meta);
  } catch (err) {
    console.error('logEpicActivity error:', err);
  }
}

/** List recent activity for an epic. */
export async function listEpicActivity(epicId, limit = 50) {
  const rows = await repo.findActivityByEpicId(epicId, limit);
  return rows.map((r) => ({
    id:        r.id,
    action:    r.action,
    meta:      r.meta,
    createdAt: r.createdAt,
    user:      r.userId ? { id: r.userId, name: r.userName } : null,
  }));
}
