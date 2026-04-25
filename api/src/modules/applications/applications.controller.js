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
    // Extract tenant scope (set by middleware)
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    
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
    const result = await applicationsService.listApplications(tenantId, req.query);
    
    // Set appropriate cache headers based on response type
    if (Array.isArray(result)) {
      // Legacy array response - shorter cache for dynamic data
      res.set('Cache-Control', 'private, max-age=60');
    } else {
      // Paginated response - can cache longer due to pagination metadata
      res.set('Cache-Control', 'private, max-age=300');
    }

    res.json(result);
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
