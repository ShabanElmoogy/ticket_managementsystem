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
    res.json(await ticketsService.listTickets(req.query, tenantId(req), req.user?.role, actorId(req)));
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
