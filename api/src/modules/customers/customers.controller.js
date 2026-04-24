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
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await customersService.listCustomers(tenantId));
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
