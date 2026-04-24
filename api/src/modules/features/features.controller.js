/**
 * features.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 *
 * Tenant scoping is enforced by enforceTenantScope middleware.
 * Controllers read req.tenantScope.
 */

import { handleError } from '../../errors/index.js';
import * as featuresService from './features.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;
const actorId  = (req) => req.user?.userId ?? req.user?.id;

// ── Feature handlers ──────────────────────────────────────────────────────────

export const listFeatures = async (req, res) => {
  try {
    res.json(await featuresService.listFeatures(tenantId(req), actorId(req)));
  } catch (e) { handleError(res, e, 'List features'); }
};

export const getFeature = async (req, res) => {
  try {
    res.json(await featuresService.getFeature(req.params.id, actorId(req)));
  } catch (e) { handleError(res, e, 'Get feature'); }
};

export const createFeature = async (req, res) => {
  try {
    const feature = await featuresService.createFeature(tenantId(req), req.body, actorId(req));
    res.status(201).json(feature);
  } catch (e) { handleError(res, e, 'Create feature'); }
};

export const updateFeature = async (req, res) => {
  try {
    res.json(await featuresService.updateFeature(req.params.id, req.body, actorId(req), req));
  } catch (e) { handleError(res, e, 'Update feature'); }
};

export const deleteFeature = async (req, res) => {
  try {
    res.json(await featuresService.deleteFeature(req.params.id));
  } catch (e) { handleError(res, e, 'Delete feature'); }
};

export const toggleVote = async (req, res) => {
  try {
    res.json(await featuresService.toggleVote(req.params.id, actorId(req)));
  } catch (e) { handleError(res, e, 'Toggle vote'); }
};

// ── Step handlers ─────────────────────────────────────────────────────────────

export const listSteps = async (req, res) => {
  try {
    res.json(await featuresService.listSteps(req.params.id));
  } catch (e) { handleError(res, e, 'List steps'); }
};

export const createStep = async (req, res) => {
  try {
    const step = await featuresService.createStep(req.params.id, req.body);
    res.status(201).json(step);
  } catch (e) { handleError(res, e, 'Create step'); }
};

export const updateStep = async (req, res) => {
  try {
    res.json(await featuresService.updateStep(req.params.id, req.params.stepId, req.body, actorId(req), req));
  } catch (e) { handleError(res, e, 'Update step'); }
};

export const deleteStep = async (req, res) => {
  try {
    res.json(await featuresService.deleteStep(req.params.stepId));
  } catch (e) { handleError(res, e, 'Delete step'); }
};
