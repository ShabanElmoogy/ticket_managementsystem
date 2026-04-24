/**
 * programming.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by requireTenantScopeMiddleware before
 * these handlers run. Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as programmingService from './programming.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = (req) => req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
const actorId  = (req) => req.user?.userId ?? req.user?.id;
const safeEmit = (req) => typeof req.emitNotification === 'function' ? req.emitNotification : null;

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getProgrammingDetails = async (req, res) => {
  try {
    const result = await programmingService.getProgrammingDetails(
      req.params.id,
      tenantId(req),
      actorId(req),
      req.user?.role,
    );
    res.json(result);
  } catch (e) { handleError(res, e, 'Get programming details'); }
};

export const upsertProgrammingDetails = async (req, res) => {
  try {
    res.json(await programmingService.upsertProgrammingDetails(
      req.params.id,
      tenantId(req),
      req.body,
      actorId(req),
      req.user?.role,
    ));
  } catch (e) { handleError(res, e, 'Upsert programming details'); }
};

export const assignProgrammer = async (req, res) => {
  try {
    res.json(await programmingService.assignProgrammer(
      req.params.id,
      tenantId(req),
      req.body.programmerId,
      actorId(req),
      req.user?.name,
      safeEmit(req),
    ));
  } catch (e) { handleError(res, e, 'Assign programmer'); }
};
