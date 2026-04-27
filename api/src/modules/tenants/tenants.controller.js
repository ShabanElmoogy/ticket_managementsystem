/**
 * tenants.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 */

import { handleError } from '../../errors/index.js';
import * as tenantsService from './tenants.service.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

export const listTenants = async (req, res) => {
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
    const result = await tenantsService.listTenants(req.query);
    
    // Set appropriate cache headers based on response type
    if (Array.isArray(result)) {
      // Legacy array response - shorter cache for dynamic data
      res.set('Cache-Control', 'private, max-age=60');
    } else {
      // Paginated response - can cache longer due to pagination metadata
      res.set('Cache-Control', 'private, max-age=300');
    }

    res.json(result);
  } catch (e) { handleError(res, e, 'List tenants'); }
};

export const listTenantsPublic = async (req, res) => {
  try {
    res.json(await tenantsService.listTenantsPublic());
  } catch (e) { handleError(res, e, 'List tenants public'); }
};

export const getTenantBySlug = async (req, res) => {
  try {
    res.json(await tenantsService.getTenantBySlug(req.params.slug));
  } catch (e) { handleError(res, e, 'Get tenant by slug'); }
};

export const getTenantStats = async (req, res) => {
  try {
    res.json(await tenantsService.getTenantStats(req.params.id));
  } catch (e) { handleError(res, e, 'Get tenant stats'); }
};

export const createTenant = async (req, res) => {
  try {
    const tenant = await tenantsService.createTenant(req.body);
    res.status(201).json(tenant);
  } catch (e) { handleError(res, e, 'Create tenant'); }
};

export const updateTenant = async (req, res) => {
  try {
    res.json(await tenantsService.updateTenant(req.params.id, req.body));
  } catch (e) { handleError(res, e, 'Update tenant'); }
};

export const activateTenant = async (req, res) => {
  try {
    res.json(await tenantsService.activateTenant(req.params.id));
  } catch (e) { handleError(res, e, 'Activate tenant'); }
};

export const deactivateTenant = async (req, res) => {
  try {
    res.json(await tenantsService.deactivateTenant(req.params.id));
  } catch (e) { handleError(res, e, 'Deactivate tenant'); }
};

export const deleteTenant = async (req, res) => {
  try {
    res.json(await tenantsService.deleteTenant(req.params.id));
  } catch (e) { handleError(res, e, 'Delete tenant'); }
};

export const getPaginationSettings = async (req, res) => {
  try {
    // Tenant admin reads own tenant; super admin passes :id
    const tenantId = req.user?.tenantId ?? req.params.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    res.json(await tenantsService.getPaginationSettings(tenantId));
  } catch (e) { handleError(res, e, 'Get pagination settings'); }
};

export const updatePaginationSettings = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId ?? req.params.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
    res.json(await tenantsService.updatePaginationSettings(tenantId, req.body));
  } catch (e) { handleError(res, e, 'Update pagination settings'); }
};
