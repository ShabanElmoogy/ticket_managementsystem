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
    res.json(await tasksService.listTasks({
      boardId:  req.query.boardId,
      tenantId: tenantId(req),
    }));
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
