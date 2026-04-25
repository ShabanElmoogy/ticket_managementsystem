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
    const result = await templatesService.listTemplates(tenantId(req), req.query);
    
    // Set appropriate cache headers based on response type
    if (Array.isArray(result)) {
      // Legacy array response - shorter cache for dynamic data
      res.set('Cache-Control', 'private, max-age=60');
    } else {
      // Paginated response - can cache longer due to pagination metadata
      res.set('Cache-Control', 'private, max-age=300');
    }

    res.json(result);
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
