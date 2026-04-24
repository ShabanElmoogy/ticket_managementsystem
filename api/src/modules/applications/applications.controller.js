/**
 * applications.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 */

import { getTenantScope, requireTenantScope } from '../../utils/tenantUtils.js';
import * as applicationsService from './applications.service.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function handleError(res, error, context) {
  const status = error.status ?? 500;
  if (status === 500) console.error(`${context} error:`, error);
  res.status(status).json({ error: error.message ?? 'Internal server error' });
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getAllApplications = async (req, res) => {
  try {
    const scope    = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    res.json(await applicationsService.listApplications(tenantId));
  } catch (e) { handleError(res, e, 'Get all applications'); }
};

export const getApplicationById = async (req, res) => {
  try {
    const scope    = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    res.json(await applicationsService.getApplicationById(req.params.id, tenantId));
  } catch (e) { handleError(res, e, 'Get application by ID'); }
};

export const createApplication = async (req, res) => {
  try {
    const tenantId = requireTenantScope(req);
    const app      = await applicationsService.createApplication(tenantId, req.body);
    res.status(201).json(app);
  } catch (e) { handleError(res, e, 'Create application'); }
};

export const updateApplication = async (req, res) => {
  try {
    const scope    = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    res.json(await applicationsService.updateApplication(req.params.id, tenantId, req.body));
  } catch (e) { handleError(res, e, 'Update application'); }
};

export const deleteApplication = async (req, res) => {
  try {
    const scope    = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    res.json(await applicationsService.deleteApplication(req.params.id, tenantId));
  } catch (e) { handleError(res, e, 'Delete application'); }
};

export const assignCustomer = async (req, res) => {
  try {
    const tenantId = requireTenantScope(req);
    const { applicationId, customerId } = req.body;
    const result = await applicationsService.assignCustomer(tenantId, applicationId, customerId);
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Assign customer to application'); }
};

export const removeCustomer = async (req, res) => {
  try {
    const tenantId = requireTenantScope(req);
    const { applicationId, customerId } = req.params;
    res.json(await applicationsService.removeCustomer(tenantId, applicationId, customerId));
  } catch (e) { handleError(res, e, 'Remove customer from application'); }
};
