/**
 * customerVisits.controller.js
 * HTTP handlers for customer visit log endpoints.
 * No business logic — delegates to customerVisits.service.js.
 */

import { handleError } from '../../../errors/index.js';
import * as visitsService from './customerVisits.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getTenantId = (req) =>
  req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;

const getUserId = (req) => req.user?.userId ?? req.user?.id;

// ── Handlers ──────────────────────────────────────────────────────────────────

export const listVisits = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    res.json(await visitsService.listVisits(req.params.customerId, tenantId));
  } catch (e) { handleError(res, e, 'List customer visits'); }
};

export const getVisitById = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    res.json(await visitsService.getVisitById(req.params.visitId, req.params.customerId, tenantId));
  } catch (e) { handleError(res, e, 'Get visit by ID'); }
};

export const createVisit = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    const userId   = getUserId(req);
    const visit    = await visitsService.createVisit(req.params.customerId, tenantId, userId, req.body);
    res.status(201).json(visit);
  } catch (e) { handleError(res, e, 'Create customer visit'); }
};

export const updateVisit = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;
    const userId   = getUserId(req);
    res.json(await visitsService.updateVisit(req.params.visitId, req.params.customerId, tenantId, userId, req.body));
  } catch (e) { handleError(res, e, 'Update customer visit'); }
};

export const deleteVisit = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;
    res.json(await visitsService.deleteVisit(req.params.visitId, req.params.customerId, tenantId));
  } catch (e) { handleError(res, e, 'Delete customer visit'); }
};
