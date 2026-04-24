/**
 * kanban.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope middleware.
 * Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as kanbanService from './kanban.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;
const actorId  = (req) => req.user?.userId ?? req.user?.id;

// ── Board handlers ────────────────────────────────────────────────────────────

export const getAllBoards = async (req, res) => {
  try {
    res.json(await kanbanService.listBoards(tenantId(req)));
  } catch (e) { handleError(res, e, 'Get all boards'); }
};

export const getBoardById = async (req, res) => {
  try {
    res.json(await kanbanService.getBoardById(req.params.id, tenantId(req)));
  } catch (e) { handleError(res, e, 'Get board by ID'); }
};

export const createBoard = async (req, res) => {
  try {
    const board = await kanbanService.createBoard(tenantId(req), req.body, actorId(req));
    res.status(201).json(board);
  } catch (e) { handleError(res, e, 'Create board'); }
};

export const updateBoard = async (req, res) => {
  try {
    res.json(await kanbanService.updateBoard(req.params.id, tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Update board'); }
};

export const deleteBoard = async (req, res) => {
  try {
    res.json(await kanbanService.deleteBoard(req.params.id, tenantId(req)));
  } catch (e) { handleError(res, e, 'Delete board'); }
};

export const getBoardAnalytics = async (req, res) => {
  try {
    res.json(await kanbanService.getBoardAnalytics(req.params.boardId, tenantId(req)));
  } catch (e) { handleError(res, e, 'Get board analytics'); }
};

// ── Column handlers ───────────────────────────────────────────────────────────

export const addColumn = async (req, res) => {
  try {
    const column = await kanbanService.addColumn(req.params.boardId, tenantId(req), req.body);
    res.status(201).json(column);
  } catch (e) { handleError(res, e, 'Add column'); }
};

export const updateColumn = async (req, res) => {
  try {
    res.json(await kanbanService.updateColumn(req.params.columnId, tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Update column'); }
};

export const deleteColumn = async (req, res) => {
  try {
    res.json(await kanbanService.deleteColumn(req.params.columnId, tenantId(req)));
  } catch (e) { handleError(res, e, 'Delete column'); }
};

// ── Move handlers ─────────────────────────────────────────────────────────────

export const moveTicket = async (req, res) => {
  try {
    res.json(await kanbanService.moveTicket(req.params.ticketId, tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Move ticket'); }
};

export const moveTask = async (req, res) => {
  try {
    res.json(await kanbanService.moveTask(req.params.taskId, tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Move task'); }
};
