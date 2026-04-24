/**
 * applications.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by middleware (enforceTenantScope /
 * requireTenantScopeMiddleware) before this handler runs.
 * Controllers read req.tenantScope — never call getTenantScope() directly.
 */

import { handleError } from '../../errors/index.js';
import * as applicationsService from './applications.service.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getAllApplications = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await applicationsService.listApplications(tenantId));
  } catch (e) { handleError(res, e, 'Get all applications'); }
};

export const getApplicationById = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await applicationsService.getApplicationById(req.params.id, tenantId));
  } catch (e) { handleError(res, e, 'Get application by ID'); }
};

export const createApplication = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    const app      = await applicationsService.createApplication(tenantId, req.body);
    res.status(201).json(app);
  } catch (e) { handleError(res, e, 'Create application'); }
};

export const updateApplication = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    res.json(await applicationsService.updateApplication(req.params.id, tenantId, req.body));
  } catch (e) { handleError(res, e, 'Update application'); }
};

export const deleteApplication = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    const force    = req.query?.force === 'true';
    res.json(await applicationsService.deleteApplication(req.params.id, tenantId, force));
  } catch (e) { handleError(res, e, 'Delete application'); }
};

export const assignCustomer = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    const { applicationId, customerId } = req.body;
    const result = await applicationsService.assignCustomer(tenantId, applicationId, customerId);
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Assign customer to application'); }
};

export const removeCustomer = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    const { applicationId, customerId } = req.params;
    res.json(await applicationsService.removeCustomer(tenantId, applicationId, customerId));
  } catch (e) { handleError(res, e, 'Remove customer from application'); }
};
