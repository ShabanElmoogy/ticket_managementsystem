/**
 * epics.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope middleware.
 * Controllers read req.tenantScope.
 */

import { handleError } from '../../../errors/index.js';
import * as epicsService from './epics.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const actorId = (req) => req.user?.userId ?? req.user?.id;
const tenantId = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;

// ── Epic CRUD ─────────────────────────────────────────────────────────────────

export const listEpics = async (req, res) => {
  try {
    res.json(await epicsService.listEpics(tenantId(req)));
  } catch (e) { handleError(res, e, 'List epics'); }
};

export const getEpic = async (req, res) => {
  try {
    res.json(await epicsService.getEpic(req.params.id));
  } catch (e) { handleError(res, e, 'Get epic'); }
};

export const createEpic = async (req, res) => {
  try {
    const epic = await epicsService.createEpic(tenantId(req), req.body, actorId(req));
    res.status(201).json(epic);
  } catch (e) { handleError(res, e, 'Create epic'); }
};

export const updateEpic = async (req, res) => {
  try {
    res.json(await epicsService.updateEpic(req.params.id, req.body, actorId(req)));
  } catch (e) { handleError(res, e, 'Update epic'); }
};

export const deleteEpic = async (req, res) => {
  try {
    res.json(await epicsService.deleteEpic(req.params.id));
  } catch (e) { handleError(res, e, 'Delete epic'); }
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    res.json(await epicsService.bulkUpdateStatus(req.body.ids, req.body.status));
  } catch (e) { handleError(res, e, 'Bulk update epic status'); }
};

// ── Feature linking ───────────────────────────────────────────────────────────

export const linkFeature = async (req, res) => {
  try {
    res.json(await epicsService.linkFeature(req.params.id, req.body.featureId, actorId(req)));
  } catch (e) { handleError(res, e, 'Link feature'); }
};

export const unlinkFeature = async (req, res) => {
  try {
    res.json(await epicsService.unlinkFeature(req.params.featureId, actorId(req)));
  } catch (e) { handleError(res, e, 'Unlink feature'); }
};

export const reorderFeatures = async (req, res) => {
  try {
    res.json(await epicsService.reorderFeatures(req.params.id, req.body.order, actorId(req)));
  } catch (e) { handleError(res, e, 'Reorder features'); }
};

// ── Dependencies ──────────────────────────────────────────────────────────────

export const addBlocker = async (req, res) => {
  try {
    res.json(await epicsService.addBlocker(req.params.id, req.body.blockerId));
  } catch (e) { handleError(res, e, 'Add blocker'); }
};

export const removeBlocker = async (req, res) => {
  try {
    res.json(await epicsService.removeBlocker(req.params.id, req.params.blockerId));
  } catch (e) { handleError(res, e, 'Remove blocker'); }
};

// ── Linked tickets ────────────────────────────────────────────────────────────

export const listLinkedTickets = async (req, res) => {
  try {
    res.json(await epicsService.listLinkedTickets(req.params.id));
  } catch (e) { handleError(res, e, 'List linked tickets'); }
};

export const linkTicket = async (req, res) => {
  try {
    res.json(await epicsService.linkTicket(req.params.id, req.body.ticketId, actorId(req)));
  } catch (e) { handleError(res, e, 'Link ticket'); }
};

export const unlinkTicket = async (req, res) => {
  try {
    res.json(await epicsService.unlinkTicket(req.params.id, req.params.ticketId, actorId(req)));
  } catch (e) { handleError(res, e, 'Unlink ticket'); }
};

// ── Sub-epics ─────────────────────────────────────────────────────────────────

export const listSubEpics = async (req, res) => {
  try {
    res.json(await epicsService.listSubEpics(req.params.id));
  } catch (e) { handleError(res, e, 'List sub-epics'); }
};

// ── Auto-close ────────────────────────────────────────────────────────────────

export const checkAutoClose = async (req, res) => {
  try {
    res.json(await epicsService.checkAutoClose(req.params.id));
  } catch (e) { handleError(res, e, 'Check auto-close'); }
};

// ── Relations ─────────────────────────────────────────────────────────────────

export const listRelations = async (req, res) => {
  try {
    res.json(await epicsService.listRelations(req.params.id));
  } catch (e) { handleError(res, e, 'List relations'); }
};

export const addRelation = async (req, res) => {
  try {
    const row = await epicsService.addRelation(req.params.id, req.body.targetEpicId, req.body.relationType);
    res.status(201).json(row);
  } catch (e) { handleError(res, e, 'Add relation'); }
};

export const removeRelation = async (req, res) => {
  try {
    res.json(await epicsService.removeRelation(req.params.relationId));
  } catch (e) { handleError(res, e, 'Remove relation'); }
};

// ── Network graph ─────────────────────────────────────────────────────────────

export const getNetworkGraph = async (req, res) => {
  try {
    res.json(await epicsService.getNetworkGraph(tenantId(req)));
  } catch (e) { handleError(res, e, 'Get network graph'); }
};

// ── Burndown ──────────────────────────────────────────────────────────────────

export const getEpicBurndown = async (req, res) => {
  try {
    res.json(await epicsService.getEpicBurndown(req.params.id));
  } catch (e) { handleError(res, e, 'Get epic burndown'); }
};
