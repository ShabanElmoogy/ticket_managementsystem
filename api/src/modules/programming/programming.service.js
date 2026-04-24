/**
 * programming.service.js
 * Business logic for the programming module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './programming.repository.js';
import { logActivity } from '../../utils/activityUtils.js';
import { Role } from '../../constants/roles.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── camelCase normalisation ───────────────────────────────────────────────────

/**
 * Drizzle returns snake_case column names when using raw `.select()`.
 * Convert to camelCase for the API response.
 */
function toCamel(row) {
  if (!row) return row;
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      v,
    ]),
  );
}

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * Get programming details for a ticket.
 * PROGRAMMER role can only see details for their own assigned ticket.
 */
export async function getProgrammingDetails(ticketId, tenantId, actorId, actorRole) {
  const detail = await repo.findProgrammingDetails(ticketId, tenantId);
  if (!detail) return null;

  const camel = toCamel(detail);

  if (actorRole === Role.PROGRAMMER && camel.programmerId !== actorId) {
    throw fail('Access denied', 403);
  }

  return camel;
}

/**
 * Upsert programming details for a ticket.
 * PROGRAMMER role can only edit details for their own assigned ticket.
 * Logs a PROGRAMMING_UPDATED activity after save.
 */
export async function upsertProgrammingDetails(ticketId, tenantId, body, actorId, actorRole) {
  const ticket = await repo.findTicketInTenant(ticketId, tenantId);
  if (!ticket) throw fail('Ticket not found', 404);

  if (actorRole === Role.PROGRAMMER && ticket.programmerId !== actorId) {
    throw fail('Access denied', 403);
  }

  const payload = { ...body, ticketId, tenantId, updatedAt: new Date() };

  const existing = await repo.findProgrammingDetailsMeta(ticketId);

  const result = existing
    ? await repo.updateProgrammingDetails(ticketId, payload)
    : await repo.insertProgrammingDetails(payload);

  await logActivity({
    ticketId,
    userId:      actorId,
    action:      'PROGRAMMING_UPDATED',
    description: 'Programming details updated',
  });

  return toCamel(result);
}

/**
 * Assign a programmer to a ticket.
 * Verifies the programmer exists in the tenant with PROGRAMMER role.
 * Sets ticket status to PROGRAMMING and emits a notification to all tenant users.
 */
export async function assignProgrammer(ticketId, tenantId, programmerId, actorId, actorName, safeEmit) {
  const programmer = await repo.findProgrammerInTenant(programmerId, tenantId);
  if (!programmer) throw fail('Programmer not found in this tenant', 404);

  const updated = await repo.assignProgrammerToTicket(ticketId, programmerId);
  if (!updated) throw fail('Ticket not found', 404);

  await logActivity({
    ticketId,
    userId:      actorId,
    action:      'PROGRAMMER_ASSIGNED',
    description: `Assigned to programmer: ${programmer.name}`,
    newValue:    programmerId,
  });

  // Notify all tenant users so the activity feed updates for everyone
  if (safeEmit) {
    const userIds = await repo.findTenantUserIds(tenantId);
    const payload = {
      type: 'TICKET_ASSIGNED',
      data: {
        ticket:     { id: updated.id, title: updated.title, status: updated.status },
        assignedTo: programmer.name,
        updatedBy:  actorName,
      },
    };
    userIds.forEach((id) => safeEmit(id, payload));
  }

  return updated;
}
