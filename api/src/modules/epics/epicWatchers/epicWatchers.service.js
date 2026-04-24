/**
 * epicWatchers.service.js
 * Business logic for epic watchers and watcher notifications.
 */

import * as repo from './epicWatchers.repository.js';

export async function getWatchers(epicId) {
  return repo.findWatchersByEpicId(epicId);
}

export async function watchEpic(epicId, userId) {
  await repo.insertWatcher(epicId, userId);
  return { watching: true };
}

export async function unwatchEpic(epicId, userId) {
  await repo.deleteWatcher(epicId, userId);
  return { watching: false };
}

/**
 * Notify all watchers of an epic.
 * Called from comments and epic updates.
 *
 * @param {string}   epicId
 * @param {string}   excludeUserId  — actor; skip their own notification
 * @param {object}   payload        — { type, title, message, data }
 * @param {Function} emitFn         — (userId, payload) => void
 */
export async function notifyEpicWatchers(epicId, excludeUserId, payload, emitFn) {
  try {
    const watcherIds = await repo.findWatcherIds(epicId, excludeUserId);

    for (const uid of watcherIds) {
      try {
        const notification = await repo.insertNotification({
          userId:   uid,
          ticketId: null,
          type:     payload.type ?? 'EPIC_UPDATED',
          title:    payload.title,
          message:  payload.message,
        });
        if (emitFn) {
          emitFn(uid, {
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
}
