/**
 * customers.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by middleware (enforceTenantScope /
 * requireTenantScopeMiddleware) before this handler runs.
 * Controllers read req.tenantScope — never call getTenantScope() directly.
 */

import { handleError } from '../../errors/index.js';
import * as customersService from './customers.service.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getAllCustomers = async (req, res) => {
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
    const result = await customersService.listCustomers(tenantId, req.query);
    
    // Set appropriate cache headers based on response type
    if (Array.isArray(result)) {
      // Legacy array response - shorter cache for dynamic data
      res.set('Cache-Control', 'private, max-age=60');
    } else {
      // Paginated response - can cache longer due to pagination metadata
      res.set('Cache-Control', 'private, max-age=300');
    }

    res.json(result);
  } catch (e) { handleError(res, e, 'Get all customers'); }
};

export const getCustomerById = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await customersService.getCustomerById(req.params.id, tenantId));
  } catch (e) { handleError(res, e, 'Get customer by ID'); }
};

export const createCustomer = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    const customer = await customersService.createCustomer(tenantId, req.body);
    res.status(201).json(customer);
  } catch (e) { handleError(res, e, 'Create customer'); }
};

export const updateCustomer = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    res.json(await customersService.updateCustomer(req.params.id, tenantId, req.body));
  } catch (e) { handleError(res, e, 'Update customer'); }
};

export const deleteCustomer = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    res.json(await customersService.deleteCustomer(req.params.id, tenantId));
  } catch (e) { handleError(res, e, 'Delete customer'); }
};

export const assignApplication = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    const { customerId, applicationId } = req.body;
    const result = await customersService.assignApplication(tenantId, customerId, applicationId);
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Assign application to customer'); }
};

export const removeApplication = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by requireTenantScopeMiddleware
    const { customerId, applicationId } = req.params;
    res.json(await customersService.removeApplication(tenantId, customerId, applicationId));
  } catch (e) { handleError(res, e, 'Remove application from customer'); }
};
