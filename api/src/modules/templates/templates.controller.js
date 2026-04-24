/**
 * templates.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope / requireTenantScopeMiddleware
 * before these handlers run. Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as templatesService from './templates.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;
const actorId  = (req) => req.user?.userId ?? req.user?.id;

// ── Handlers ──────────────────────────────────────────────────────────────────

export const listTemplates = async (req, res) => {
  try {
    res.json(await templatesService.listTemplates(tenantId(req)));
  } catch (e) { handleError(res, e, 'List templates'); }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await templatesService.createTemplate(tenantId(req), req.body, actorId(req));
    res.status(201).json(template);
  } catch (e) { handleError(res, e, 'Create template'); }
};

export const updateTemplate = async (req, res) => {
  try {
    res.json(await templatesService.updateTemplate(req.params.id, tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Update template'); }
};

export const deleteTemplate = async (req, res) => {
  try {
    res.json(await templatesService.deleteTemplate(req.params.id, tenantId(req)));
  } catch (e) { handleError(res, e, 'Delete template'); }
};
