/**
 * dashboard.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope middleware before
 * these handlers run. Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as dashboardService from './dashboard.service.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getStats = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    const isAdmin  = req.user.role === 'SUPER_ADMIN' || req.user.role === 'TENANT_ADMIN';
    const userId   = req.user?.userId ?? req.user?.id;

    res.json(await dashboardService.getStats({ tenantId, isAdmin, userId }));
  } catch (e) { handleError(res, e, 'Get dashboard stats'); }
};

export const getActivities = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    const limit    = req.query.limit ?? 20;

    res.json(await dashboardService.getActivities({ tenantId, limit }));
  } catch (e) { handleError(res, e, 'Get dashboard activities'); }
};
