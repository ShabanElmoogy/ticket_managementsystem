/**
 * watchers/watchers.service.js
 * Business logic for ticket watchers.
 */

import * as repo from './watchers.repository.js';
import { isTenantScopedRole } from '../../../middleware/auth.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function getWatchers(ticketId) {
  return repo.findWatchersByTicketId(ticketId);
}

export async function watchTicket(ticketId, tenantId, actorId, actorRole) {
  if (isTenantScopedRole(actorRole) && tenantId) {
    const row = await repo.findTicketInTenant(ticketId, tenantId);
    if (!row) throw fail('Ticket not found', 404);
  }
  await repo.insertWatcher(ticketId, actorId);
  return { watching: true };
}

export async function unwatchTicket(ticketId, actorId) {
  await repo.deleteWatcher(ticketId, actorId);
  return { watching: false };
}

/**
 * Notify all watchers of a ticket except the actor.
 * Called from tickets.service.js after updates.
 */
export async function notifyWatchers(ticketId, excludeUserId, payload, emitFn) {
  const safeEmit = typeof emitFn === 'function' ? emitFn : () => {};
  const ids = await repo.findWatcherIds(ticketId);
  ids.filter((id) => id !== excludeUserId).forEach((id) => safeEmit(id, payload));
}
