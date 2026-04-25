/**
 * tasks.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope / requireTenantScopeMiddleware
 * before these handlers run. Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as tasksService from './tasks.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getTasks = async (req, res) => {
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
    const result = await tasksService.listTasks({
      boardId:  req.query.boardId,
      tenantId: tenantId(req),
      query:    req.query,
    });
    
    // Set appropriate cache headers based on response type
    if (Array.isArray(result)) {
      // Legacy array response - shorter cache for dynamic data
      res.set('Cache-Control', 'private, max-age=60');
    } else {
      // Paginated response - can cache longer due to pagination metadata
      res.set('Cache-Control', 'private, max-age=300');
    }

    res.json(result);
  } catch (e) { handleError(res, e, 'Get tasks'); }
};

export const getTask = async (req, res) => {
  try {
    res.json(await tasksService.getTask(req.params.id, tenantId(req)));
  } catch (e) { handleError(res, e, 'Get task'); }
};

export const createTask = async (req, res) => {
  try {
    const task = await tasksService.createTask(tenantId(req), req.body);
    res.status(201).json(task);
  } catch (e) { handleError(res, e, 'Create task'); }
};

export const updateTask = async (req, res) => {
  try {
    res.json(await tasksService.updateTask(req.params.id, tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Update task'); }
};

export const deleteTask = async (req, res) => {
  try {
    res.json(await tasksService.deleteTask(req.params.id, tenantId(req)));
  } catch (e) { handleError(res, e, 'Delete task'); }
};

export const moveTask = async (req, res) => {
  try {
    res.json(await tasksService.moveTask(req.params.id, tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Move task'); }
};
