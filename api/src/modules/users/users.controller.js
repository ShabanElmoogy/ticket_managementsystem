/**
 * users.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by middleware (enforceTenantScope /
 * requireTenantScopeMiddleware) before this handler runs.
 * Controllers read req.tenantScope — never call getTenantScope() directly.
 */

import { handleError } from '../../errors/index.js';
import * as usersService from './users.service.js';

// ── Super-admin endpoints ─────────────────────────────────────────────────────

export const getAllUsers = async (req, res) => {
  try {
    res.json(await usersService.listAllUsers());
  } catch (e) { handleError(res, e, 'Get all users'); }
};

export const getUserById = async (req, res) => {
  try {
    res.json(await usersService.getUserById(req.params.id));
  } catch (e) { handleError(res, e, 'Get user by ID'); }
};

export const createUser = async (req, res) => {
  try {
    // requireTenantScopeMiddleware guarantees tenantScope.type === 'TENANT'
    const tenantId = req.tenantScope.tenantId;
    const user = await usersService.createUser(tenantId, req.body);
    res.status(201).json(user);
  } catch (e) { handleError(res, e, 'Create user'); }
};

export const updateUser = async (req, res) => {
  try {
    res.json(await usersService.updateUser(req.params.id, req.body));
  } catch (e) { handleError(res, e, 'Update user'); }
};

export const deleteUser = async (req, res) => {
  try {
    const force = req.query?.force === 'true';
    res.json(await usersService.deleteUser(req.params.id, force));
  } catch (e) { handleError(res, e, 'Delete user'); }
};

export const resetUserPassword = async (req, res) => {
  try {
    res.json(await usersService.resetUserPassword(req.params.id, req.body.password));
  } catch (e) { handleError(res, e, 'Reset user password'); }
};

// ── Tenant-admin endpoints ────────────────────────────────────────────────────

export const getTenantUsers = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    res.json(await usersService.listTenantUsers(tenantId));
  } catch (e) { handleError(res, e, 'Get tenant users'); }
};

export const createTenantUser = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    const user = await usersService.createTenantUser(tenantId, req.body);
    res.status(201).json(user);
  } catch (e) { handleError(res, e, 'Create tenant user'); }
};

export const updateTenantUser = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    res.json(await usersService.updateTenantUser(req.params.id, tenantId, req.body));
  } catch (e) { handleError(res, e, 'Update tenant user'); }
};

export const deleteTenantUser = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    const force    = req.query?.force === 'true';
    res.json(await usersService.deleteTenantUser(req.params.id, tenantId, force));
  } catch (e) { handleError(res, e, 'Delete tenant user'); }
};

export const resetTenantUserPassword = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    res.json(await usersService.resetTenantUserPassword(req.params.id, tenantId, req.body.password));
  } catch (e) { handleError(res, e, 'Reset tenant user password'); }
};

export const getTenantSeats = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    res.json(await usersService.getTenantSeats(tenantId));
  } catch (e) { handleError(res, e, 'Get tenant seats'); }
};

// ── Profile endpoints ─────────────────────────────────────────────────────────

export const getCurrentProfile = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    res.json(await usersService.getCurrentProfile(userId));
  } catch (e) { handleError(res, e, 'Get current profile'); }
};

export const updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    res.json(await usersService.updateOwnProfile(userId, req.body));
  } catch (e) { handleError(res, e, 'Update own profile'); }
};

export const getTenantStatus = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    res.json(await usersService.getTenantStatus(userId));
  } catch (e) { handleError(res, e, 'Get tenant status'); }
};

// ── Shared endpoints ──────────────────────────────────────────────────────────

export const getUserStats = async (req, res) => {
  try {
    res.json(await usersService.getStats());
  } catch (e) { handleError(res, e, 'Get user stats'); }
};

export const getEmployees = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await usersService.getEmployees(tenantId));
  } catch (e) { handleError(res, e, 'Get employees'); }
};

export const getProgrammers = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await usersService.getProgrammers(tenantId));
  } catch (e) { handleError(res, e, 'Get programmers'); }
};
