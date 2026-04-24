/**
 * epicTemplates.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope middleware.
 * Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as epicTemplatesService from './epicTemplates.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId  = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;
const actorId   = (req) => req.user?.userId ?? req.user?.id;

// ── Handlers ──────────────────────────────────────────────────────────────────

export const listTemplates = async (req, res) => {
  try {
    res.json(await epicTemplatesService.listTemplates(tenantId(req)));
  } catch (e) { handleError(res, e, 'List epic templates'); }
};

export const getTemplate = async (req, res) => {
  try {
    res.json(await epicTemplatesService.getTemplate(req.params.id));
  } catch (e) { handleError(res, e, 'Get epic template'); }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await epicTemplatesService.createTemplate(tenantId(req), req.body, actorId(req));
    res.status(201).json(template);
  } catch (e) { handleError(res, e, 'Create epic template'); }
};

export const updateTemplate = async (req, res) => {
  try {
    res.json(await epicTemplatesService.updateTemplate(req.params.id, req.body));
  } catch (e) { handleError(res, e, 'Update epic template'); }
};

export const deleteTemplate = async (req, res) => {
  try {
    res.json(await epicTemplatesService.deleteTemplate(req.params.id));
  } catch (e) { handleError(res, e, 'Delete epic template'); }
};

export const applyTemplate = async (req, res) => {
  try {
    const result = await epicTemplatesService.applyTemplate(
      req.params.epicId,
      req.body.templateId,
      actorId(req),
    );
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Apply epic template'); }
};
