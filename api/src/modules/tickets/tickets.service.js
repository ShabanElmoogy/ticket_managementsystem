/**
 * tickets.service.js
 * Business logic for the tickets module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './tickets.repository.js';
import { logActivity } from '../../utils/activityUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';
import { getSlaHours, computeSlaDeadline } from '../../utils/slaUtils.js';
import { isTenantScopedRole } from '../../middleware/auth.js';
import { isNull, isNotNull, eq, or, and, ilike } from 'drizzle-orm';
import { tickets } from './tickets.schema.js';
import { users } from '../users/users.schema.js';
import { notifyWatchers } from './watchers/watchers.service.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Notification helpers ──────────────────────────────────────────────────────

const safeEmit = (emitFn) => typeof emitFn === 'function' ? emitFn : () => {};

async function emitToTenant(tenantId, payload, emitFn) {
  const emit = safeEmit(emitFn);
  if (tenantId) {
    const ids = await repo.findTenantUserIds(tenantId);
    ids.forEach((id) => emit(id, payload));
  } else {
    emit('broadcast', payload);
  }
}

async function notifyWatchersService(ticketId, excludeUserId, payload, emitFn) {
  return notifyWatchers(ticketId, excludeUserId, payload, emitFn);
}

// ── Relation enrichment ───────────────────────────────────────────────────────

/**
 * Enrich a list of raw ticket rows with related data in batch queries.
 * Used by listTickets — 6 parallel queries regardless of list size.
 */
async function enrichTicketList(ticketRows) {
  if (!ticketRows.length) return [];

  const ticketIds      = ticketRows.map((t) => t.id);
  const assignedIds    = [...new Set(ticketRows.map((t) => t.assignedToId).filter(Boolean))];
  const createdIds     = [...new Set(ticketRows.map((t) => t.createdById).filter(Boolean))];
  const programmerIds  = [...new Set(ticketRows.map((t) => t.programmerId).filter(Boolean))];
  const customerIds    = [...new Set(ticketRows.map((t) => t.customerId).filter(Boolean))];
  const applicationIds = [...new Set(ticketRows.map((t) => t.applicationId).filter(Boolean))];

  const [assignedUsers, createdUsers, programmerUsers, ticketCustomers, ticketApplications, labelsData, commentCounts] = await Promise.all([
    repo.findUsersByIds(assignedIds),
    repo.findUsersByIds(createdIds),
    repo.findUsersByIds(programmerIds),
    repo.findCustomersByIds(customerIds),
    repo.findApplicationsByIds(applicationIds),
    repo.findLabelsByTicketIds(ticketIds),
    repo.findCommentCountsByTicketIds(ticketIds),
  ]);

  const userMap        = Object.fromEntries(assignedUsers.concat(createdUsers, programmerUsers).map((u) => [u.id, u]));
  const customerMap    = Object.fromEntries(ticketCustomers.map((c) => [c.id, c]));
  const applicationMap = Object.fromEntries(ticketApplications.map((a) => [a.id, a]));

  return ticketRows.map((ticket) => ({
    ...ticket,
    assignedTo:  ticket.assignedToId  ? (userMap[ticket.assignedToId]  ?? null) : null,
    createdBy:   ticket.createdById   ? (userMap[ticket.createdById]   ?? null) : null,
    programmer:  ticket.programmerId  ? (userMap[ticket.programmerId]  ?? null) : null,
    customer:    ticket.customerId    ? (customerMap[ticket.customerId]    ?? null) : null,
    application: ticket.applicationId ? (applicationMap[ticket.applicationId] ?? null) : null,
    labels:      labelsData.filter((l) => l.ticketId === ticket.id).map((l) => ({ label: l.label })),
    _count:      { comments: Number(commentCounts.find((c) => c.ticketId === ticket.id)?.count ?? 0) },
  }));
}

/**
 * Enrich a single ticket row with full related data.
 * Used by getTicketById — parallel queries for all relations.
 */
async function enrichTicketDetail(ticket) {
  const [assignedUser, createdUser, customer, application, labelsData, commentsData, activitiesData] = await Promise.all([
    ticket.assignedToId  ? repo.findUsersByIds([ticket.assignedToId])  : Promise.resolve([]),
    ticket.createdById   ? repo.findUsersByIds([ticket.createdById])   : Promise.resolve([]),
    ticket.customerId    ? repo.findCustomersByIds([ticket.customerId])    : Promise.resolve([]),
    ticket.applicationId ? repo.findApplicationsByIds([ticket.applicationId]) : Promise.resolve([]),
    repo.findLabelsByTicketIds([ticket.id]),
    repo.findCommentsByTicketId(ticket.id),
    repo.findActivitiesByTicketId(ticket.id),
  ]);

  return {
    ...ticket,
    assignedTo:  assignedUser[0]  ?? null,
    createdBy:   createdUser[0]   ?? null,
    customer:    customer[0]      ?? null,
    application: application[0]   ?? null,
    labels:      labelsData,
    comments:    commentsData,
    activities:  activitiesData,
  };
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listTickets(query, tenantId, actorRole, actorId) {
  const { status, assignedTo, priority, deleted, search, customerId, applicationId, userId } = query;

  const conditions = [];

  if (status)      conditions.push(eq(tickets.status, status));
  if (priority)    conditions.push(eq(tickets.priority, priority));
  if (customerId)  conditions.push(eq(tickets.customerId, customerId));
  if (applicationId) conditions.push(eq(tickets.applicationId, applicationId));
  if (userId)      conditions.push(or(eq(tickets.createdById, userId), eq(tickets.assignedToId, userId)));
  if (search)      conditions.push(or(ilike(tickets.title, `%${search}%`), ilike(tickets.description, `%${search}%`)));

  if (assignedTo === 'none') conditions.push(isNull(tickets.assignedToId));
  else if (assignedTo)       conditions.push(eq(tickets.assignedToId, assignedTo));

  if (deleted === 'true') conditions.push(isNotNull(tickets.deletedAt));
  else                    conditions.push(isNull(tickets.deletedAt));

  // Tenant scoping
  if (isTenantScopedRole(actorRole)) {
    if (!tenantId) throw fail('Tenant context required', 403);
    conditions.push(eq(users.tenantId, tenantId));
  }

  // Role-based visibility
  if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'TENANT_ADMIN') {
    if (actorRole === 'PROGRAMMER') {
      conditions.push(eq(tickets.programmerId, actorId));
    } else {
      conditions.push(or(eq(tickets.assignedToId, actorId), isNull(tickets.assignedToId)));
    }
  }

  const rows = await repo.findTickets({ conditions });
  return enrichTicketList(rows);
}

export async function getTicketById(ticketId, tenantId, actorRole, actorId) {
  let ticket;

  if (isTenantScopedRole(actorRole)) {
    if (!tenantId) throw fail('Tenant context required', 403);
    ticket = await repo.findTicketInTenant(ticketId, tenantId);
    if (!ticket) throw fail('Ticket not found', 404);

    // EMPLOYEE/PROGRAMMER can only see tickets they are involved in
    if ((actorRole === 'EMPLOYEE' || actorRole === 'PROGRAMMER') &&
        ticket.assignedToId !== actorId &&
        ticket.programmerId !== actorId &&
        ticket.createdById  !== actorId) {
      throw fail('Access denied', 403);
    }
  } else {
    ticket = await repo.findTicketById(ticketId);
    if (!ticket) throw fail('Ticket not found', 404);

    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'TENANT_ADMIN' &&
        ticket.assignedToId !== actorId &&
        ticket.programmerId !== actorId &&
        ticket.createdById  !== actorId) {
      throw fail('Access denied', 403);
    }
  }

  return enrichTicketDetail(ticket);
}

export async function createTicket(tenantId, body, actorId, emitFn) {
  const {
    title, description, priority = 'MEDIUM',
    assignedToId, customerId, applicationId, boardId,
    dueDate, estimatedHours, labels: labelIds = [],
  } = body;

  // Verify creator belongs to tenant
  if (tenantId) {
    const creator = await repo.findUserInTenant(actorId, tenantId);
    if (!creator) throw fail('Invalid tenant context', 403);
  }

  const slaHours   = await getSlaHours(tenantId ?? null);
  const slaDeadline = computeSlaDeadline(new Date(), priority, slaHours);

  const ticket = await repo.insertTicket({
    title, description, priority,
    assignedToId:  assignedToId  || null,
    customerId:    customerId    || null,
    applicationId: applicationId || null,
    boardId:       boardId       || null,
    dueDate:       dueDate ? new Date(dueDate) : null,
    estimatedHours,
    createdById: actorId,
    slaDeadline,
  });

  await repo.insertTicketLabels(ticket.id, labelIds);

  await logActivity({
    ticketId:    ticket.id,
    userId:      actorId,
    action:      'CREATED',
    description: `Created ticket: ${title}`,
  });

  const [assignedUser, createdUser, customer, application, labelsData] = await Promise.all([
    assignedToId  ? repo.findUsersByIds([assignedToId])  : Promise.resolve([]),
    repo.findUsersByIds([actorId]),
    customerId    ? repo.findCustomersByIds([customerId])    : Promise.resolve([]),
    applicationId ? repo.findApplicationsByIds([applicationId]) : Promise.resolve([]),
    repo.findLabelsByTicketIds([ticket.id]),
  ]);

  const fullTicket = {
    ...ticket,
    assignedTo:  assignedUser[0]  ?? null,
    createdBy:   createdUser[0]   ?? null,
    customer:    customer[0]      ?? null,
    application: application[0]   ?? null,
    labels:      labelsData,
  };

  const payload = {
    type: assignedToId ? 'TICKET_ASSIGNED' : 'TICKET_CREATED',
    data: {
      ticket:     { id: ticket.id, title: ticket.title, priority: ticket.priority, status: ticket.status },
      createdBy:  createdUser[0]?.name,
      assignedTo: assignedUser[0]?.name ?? null,
    },
  };
  await emitToTenant(tenantId ?? null, payload, emitFn);

  return fullTicket;
}

export async function updateTicket(ticketId, tenantId, body, actorId, actorRole, emitFn) {
  const { status, priority, assignedToId, title, description, dueDate, estimatedHours, actualHours } = body;

  // Access control for tenant-scoped roles
  if (isTenantScopedRole(actorRole)) {
    if (!tenantId) throw fail('Tenant context required', 403);

    const row = await repo.findTicketMeta(ticketId, tenantId);
    if (!row) throw fail('Ticket not found', 404);

    if (actorRole === 'EMPLOYEE') {
      if (row.assignedToId !== actorId) throw fail('Access denied', 403);
      const programmingStatuses = ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING'];
      if (programmingStatuses.includes(row.status) && status) throw fail('Ticket is currently handled by a programmer', 403);
    }
    if (actorRole === 'PROGRAMMER') {
      const ticket = await repo.findTicketById(ticketId);
      if (ticket?.programmerId !== actorId) throw fail('Access denied', 403);
    }
  }

  const oldTicket = await repo.findTicketById(ticketId);
  if (!oldTicket) throw fail('Ticket not found', 404);

  const data = {};
  if (status         !== undefined) data.status         = status;
  if (priority       !== undefined) data.priority       = priority;
  if (assignedToId   !== undefined) data.assignedToId   = assignedToId;
  if (title          !== undefined) data.title          = title;
  if (description    !== undefined) data.description    = description;
  if (dueDate        !== undefined) data.dueDate        = dueDate ? new Date(dueDate) : null;
  if (estimatedHours !== undefined) data.estimatedHours = estimatedHours;
  if (actualHours    !== undefined) data.actualHours    = actualHours;

  // resolvedAt tracking
  if (status === 'RESOLVED' && oldTicket.status !== 'RESOLVED') data.resolvedAt = new Date();
  else if (status && status !== 'RESOLVED' && oldTicket.status === 'RESOLVED') data.resolvedAt = null;

  // Recompute SLA deadline on priority change
  if (priority && priority !== oldTicket.priority) {
    const slaHours = await getSlaHours(tenantId ?? null);
    data.slaDeadline = computeSlaDeadline(oldTicket.createdAt, priority, slaHours);
  }

  const updated = await repo.updateTicketById(ticketId, data);

  // Activity log
  if (status && status !== oldTicket.status) {
    await logActivity({ ticketId, userId: actorId, action: 'STATUS_CHANGED', description: `Status changed to ${status}`, oldValue: oldTicket.status, newValue: status });
  } else if (priority && priority !== oldTicket.priority) {
    await logActivity({ ticketId, userId: actorId, action: 'PRIORITY_CHANGED', description: `Priority changed to ${priority}`, oldValue: oldTicket.priority, newValue: priority });
  } else if (dueDate !== undefined) {
    const oldDate = oldTicket.dueDate ? new Date(oldTicket.dueDate).toLocaleDateString('en-GB') : 'none';
    const newDate = dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : 'none';
    await logActivity({ ticketId, userId: actorId, action: 'UPDATED', description: `Due date changed from ${oldDate} to ${newDate}`, oldValue: oldTicket.dueDate?.toISOString() ?? null, newValue: dueDate || null });
  } else {
    await logActivity({ ticketId, userId: actorId, action: 'UPDATED', description: 'Ticket updated' });
  }

  const actor = await repo.findUserById(actorId);
  const payload = {
    type: 'TICKET_UPDATED',
    data: { ticket: { id: updated.id, title: updated.title, priority: updated.priority, status: updated.status }, updatedBy: actor?.name, newStatus: status || undefined },
  };

  const notifyTenantId = tenantId ?? actor?.tenantId ?? null;
  await emitToTenant(notifyTenantId, payload, emitFn);
  await notifyWatchersService(ticketId, actorId, payload, emitFn);

  return updated;
}

export async function deleteTicket(ticketId, tenantId, actorId, actorRole, emitFn) {
  if (isTenantScopedRole(actorRole)) {
    if (!tenantId) throw fail('Tenant context required', 403);
    const row = await repo.findTicketMeta(ticketId, tenantId);
    if (!row) throw fail('Ticket not found', 404);
  }

  await repo.softDeleteTicket(ticketId);

  const [ticket, actor] = await Promise.all([
    repo.findTicketById(ticketId),
    repo.findUserById(actorId),
  ]);

  await logActivity({ ticketId, userId: actorId, action: 'DELETED', description: 'Ticket deleted' });

  const payload = { type: 'TICKET_UPDATED', data: { ticket: { id: ticketId, title: ticket?.title }, updatedBy: actor?.name, newStatus: 'DELETED' } };
  const notifyTenantId = tenantId ?? actor?.tenantId ?? null;
  await emitToTenant(notifyTenantId, payload, emitFn);

  return { message: 'Ticket deleted successfully' };
}

export async function restoreTicket(ticketId, tenantId, actorId, actorRole, emitFn) {
  if (isTenantScopedRole(actorRole)) {
    if (!tenantId) throw fail('Tenant context required', 403);
    const row = await repo.findTicketMeta(ticketId, tenantId);
    if (!row) throw fail('Ticket not found', 404);
  }

  await repo.restoreTicket(ticketId);

  const [ticket, actor] = await Promise.all([
    repo.findTicketById(ticketId),
    repo.findUserById(actorId),
  ]);

  await logActivity({ ticketId, userId: actorId, action: 'RESTORED', description: 'Ticket restored' });

  const payload = { type: 'TICKET_UPDATED', data: { ticket: { id: ticketId, title: ticket?.title }, updatedBy: actor?.name, newStatus: 'RESTORED' } };
  const notifyTenantId = tenantId ?? actor?.tenantId ?? null;
  await emitToTenant(notifyTenantId, payload, emitFn);

  return { message: 'Ticket restored successfully' };
}

export async function takeTicket(ticketId, tenantId, actorId, actorRole, emitFn) {
  if (isTenantScopedRole(actorRole) && !tenantId) throw fail('Tenant context required', 403);

  const ticket = tenantId
    ? await repo.findTicketInTenant(ticketId, tenantId)
    : await repo.findTicketById(ticketId);

  if (!ticket) throw fail('Ticket not found', 404);
  if (ticket.assignedToId) throw fail('Ticket is already assigned');

  const updated = await repo.updateTicketById(ticketId, { assignedToId: actorId, status: 'IN_PROGRESS' });

  await logActivity({ ticketId, userId: actorId, action: 'ASSIGNED', description: 'Ticket taken and assigned to self', newValue: actorId });

  return updated;
}

export async function bulkUpdateStatus(ids, status, actorId, tenantId, emitFn) {
  if (!Array.isArray(ids) || !ids.length || !status) throw fail('ids and status are required');

  await repo.bulkUpdateTicketStatus(ids, status);

  await Promise.all(ids.map((id) =>
    logActivity({ ticketId: id, userId: actorId, action: 'STATUS_CHANGED', description: `Status changed to ${status}`, newValue: status }),
  ));

  const actor = await repo.findUserById(actorId);
  const payload = { type: 'TICKET_UPDATED', data: { updatedBy: actor?.name, newStatus: status } };
  const notifyTenantId = tenantId ?? actor?.tenantId ?? null;
  await emitToTenant(notifyTenantId, payload, emitFn);

  return { updated: ids.length };
}

export async function reassignTicket(ticketId, tenantId, assignedToId, actorId, actorRole, emitFn) {
  if (!assignedToId) throw fail('assignedToId is required');

  const oldTicket = await repo.findTicketMeta(ticketId, isTenantScopedRole(actorRole) ? tenantId : null);
  if (!oldTicket) throw fail('Ticket not found', 404);

  const updated = await repo.updateTicketById(ticketId, { assignedToId, status: 'IN_PROGRESS' });

  const [oldAssignee, newAssignee] = await Promise.all([
    oldTicket.assignedToId ? repo.findUsersByIds([oldTicket.assignedToId]) : Promise.resolve([]),
    repo.findUsersByIds([assignedToId]),
  ]);

  await logActivity({
    ticketId, userId: actorId, action: 'REASSIGNED',
    description: `Reassigned from ${oldAssignee[0]?.name ?? 'unassigned'} to ${newAssignee[0]?.name}`,
    oldValue: oldTicket.assignedToId ?? null,
    newValue: assignedToId,
  });

  const payload = {
    type: 'TICKET_ASSIGNED',
    data: { ticket: { id: updated.id, title: updated.title, priority: updated.priority, status: updated.status }, assignedTo: newAssignee[0]?.name },
  };

  const emit = safeEmit(emitFn);
  if (tenantId) {
    const ids = await repo.findTenantUserIds(tenantId);
    ids.forEach((id) => emit(id, payload));
  } else {
    emit(assignedToId, payload);
  }

  return updated;
}

export async function getDelayedTickets(actorId, tenantId, actorRole) {
  if (isTenantScopedRole(actorRole) && !tenantId) throw fail('Tenant context required', 403);

  const rows = await repo.findDelayedTickets(actorId, tenantId ?? null);

  if (!rows.length) return [];

  const customerIds    = [...new Set(rows.map((t) => t.customerId).filter(Boolean))];
  const applicationIds = [...new Set(rows.map((t) => t.applicationId).filter(Boolean))];

  const [customersData, applicationsData] = await Promise.all([
    repo.findCustomersByIds(customerIds),
    repo.findApplicationsByIds(applicationIds),
  ]);

  const customerMap    = Object.fromEntries(customersData.map((c) => [c.id, c]));
  const applicationMap = Object.fromEntries(applicationsData.map((a) => [a.id, a]));

  return rows.map((t) => ({
    ...t,
    customer:    t.customerId    ? (customerMap[t.customerId]       ?? null) : null,
    application: t.applicationId ? (applicationMap[t.applicationId] ?? null) : null,
  }));
}

// Re-export notifyWatchers so tickets.controller.js can import it
export { notifyWatchers };
