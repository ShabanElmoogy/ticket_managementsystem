/**
 * docs.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope middleware before
 * these handlers run. Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as docsService from './docs.service.js';

// ── Docs ──────────────────────────────────────────────────────────────────────

export const listDocs = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await docsService.listDocs(tenantId));
  } catch (e) { handleError(res, e, 'List docs'); }
};

export const getDoc = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await docsService.getDoc(req.params.id, tenantId));
  } catch (e) { handleError(res, e, 'Get doc'); }
};

export const createDoc = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    const doc = await docsService.createDoc(tenantId, req.body);
    res.status(201).json(doc);
  } catch (e) { handleError(res, e, 'Create doc'); }
};

export const updateDoc = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    res.json(await docsService.upsertDoc(req.params.id, tenantId, req.body));
  } catch (e) { handleError(res, e, 'Update doc'); }
};

export const deleteDoc = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    await docsService.deleteDoc(req.params.id, tenantId);
    res.status(204).end();
  } catch (e) { handleError(res, e, 'Delete doc'); }
};

// ── Tree nodes ────────────────────────────────────────────────────────────────

export const listTree = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await docsService.listTree(tenantId));
  } catch (e) { handleError(res, e, 'List tree'); }
};

export const createFolder = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    const node = await docsService.createFolder(tenantId, req.body);
    res.status(201).json(node);
  } catch (e) { handleError(res, e, 'Create folder'); }
};

export const createDocNode = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    const node = await docsService.createDocNode(tenantId, req.body);
    res.status(201).json(node);
  } catch (e) { handleError(res, e, 'Create doc node'); }
};

export const renameNode = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    res.json(await docsService.renameNode(req.params.id, tenantId, req.body));
  } catch (e) { handleError(res, e, 'Rename node'); }
};

export const moveNode = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    res.json(await docsService.moveNode(req.params.id, tenantId, req.body));
  } catch (e) { handleError(res, e, 'Move node'); }
};

export const deleteNode = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId; // guaranteed by requireTenantScopeMiddleware
    await docsService.deleteNode(req.params.id, tenantId);
    res.status(204).end();
  } catch (e) { handleError(res, e, 'Delete node'); }
};
