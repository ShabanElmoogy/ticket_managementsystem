/**
 * tickets.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope / requireTenantScopeMiddleware
 * before these handlers run. Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as ticketsService from './tickets.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;
const actorId  = (req) => req.user?.userId ?? req.user?.id;
const safeEmit = (req) => typeof req.emitNotification === 'function' ? req.emitNotification : null;

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getAllTickets = async (req, res) => {
  try {
    // Validate query parameters early
    if (req.query.page && isNaN(parseInt(req.query.page))) {
      return res.status(400).json({ error: 'Page must be a number' });
    }
    if (req.query.limit && isNaN(parseInt(req.query.limit))) {
      return res.status(400).json({ error: 'Limit must be a number' });
    }
    if (req.query.search && typeof req.query.search === 'string' && req.query.search.length > 100) {
      return res.status(400).json({ error: 'Search term too long (max 100 characters)' });
    }

    // Call service with all query parameters
    const result = await ticketsService.listTickets(req.query, tenantId(req), req.user?.role, actorId(req));
    
    // Set appropriate cache headers based on response type
    if (Array.isArray(result)) {
      // Legacy array response - shorter cache for dynamic data
      res.set('Cache-Control', 'private, max-age=60');
    } else {
      // Paginated response - can cache longer due to pagination metadata
      res.set('Cache-Control', 'private, max-age=300');
    }

    res.json(result);
  } catch (e) { handleError(res, e, 'Get all tickets'); }
};

export const getTicketById = async (req, res) => {
  try {
    res.json(await ticketsService.getTicketById(req.params.id, tenantId(req), req.user?.role, actorId(req)));
  } catch (e) { handleError(res, e, 'Get ticket by ID'); }
};

export const createTicket = async (req, res) => {
  try {
    const ticket = await ticketsService.createTicket(tenantId(req), req.body, actorId(req), safeEmit(req));
    res.status(201).json(ticket);
  } catch (e) { handleError(res, e, 'Create ticket'); }
};

export const updateTicket = async (req, res) => {
  try {
    res.json(await ticketsService.updateTicket(req.params.id, tenantId(req), req.body, actorId(req), req.user?.role, safeEmit(req)));
  } catch (e) { handleError(res, e, 'Update ticket'); }
};

export const deleteTicket = async (req, res) => {
  try {
    res.json(await ticketsService.deleteTicket(req.params.id, tenantId(req), actorId(req), req.user?.role, safeEmit(req)));
  } catch (e) { handleError(res, e, 'Delete ticket'); }
};

export const restoreTicket = async (req, res) => {
  try {
    res.json(await ticketsService.restoreTicket(req.params.id, tenantId(req), actorId(req), req.user?.role, safeEmit(req)));
  } catch (e) { handleError(res, e, 'Restore ticket'); }
};

export const takeTicket = async (req, res) => {
  try {
    res.json(await ticketsService.takeTicket(req.params.id, tenantId(req), actorId(req), req.user?.role, safeEmit(req)));
  } catch (e) { handleError(res, e, 'Take ticket'); }
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    res.json(await ticketsService.bulkUpdateStatus(req.body.ids, req.body.status, actorId(req), tenantId(req), safeEmit(req)));
  } catch (e) { handleError(res, e, 'Bulk update status'); }
};

export const reassignTicket = async (req, res) => {
  try {
    res.json(await ticketsService.reassignTicket(req.params.id, tenantId(req), req.body.assignedToId, actorId(req), req.user?.role, safeEmit(req)));
  } catch (e) { handleError(res, e, 'Reassign ticket'); }
};

export const getDelayedTickets = async (req, res) => {
  try {
    res.json(await ticketsService.getDelayedTickets(actorId(req), tenantId(req), req.user?.role));
  } catch (e) { handleError(res, e, 'Get delayed tickets'); }
};

export const getTicketActivities = async (req, res) => {
  try {
    res.json(await ticketsService.getTicketActivities(req.params.id, tenantId(req), req.user?.role, actorId(req)));
  } catch (e) { handleError(res, e, 'Get ticket activities'); }
};
