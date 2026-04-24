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
    res.json(await tenantsService.listTenants());
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
