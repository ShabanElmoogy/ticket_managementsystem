/**
 * epics/epics.routes.js
 * Core epic CRUD + all sub-resource routes (features, blockers, tickets,
 * relations, sub-epics, auto-close, burndown, network graph).
 * Mounted at /epics by the top-level router.
 */

import express from 'express';
import { requireTenantAdmin } from '../../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../../utils/tenantUtils.js';
import { validate } from '../../../middleware/validate.js';
import {
  createEpicSchema, updateEpicSchema, bulkUpdateStatusSchema,
  linkFeatureSchema, reorderFeaturesSchema,
  addBlockerSchema, linkTicketSchema, addRelationSchema,
} from './epics.validation.js';
import {
  listEpics, getEpic, createEpic, updateEpic, deleteEpic,
  bulkUpdateStatus, reorderFeatures,
  linkFeature, unlinkFeature,
  addBlocker, removeBlocker,
  listLinkedTickets, linkTicket, unlinkTicket,
  listSubEpics, checkAutoClose,
  listRelations, addRelation, removeRelation,
  getNetworkGraph, getEpicBurndown,
} from './epics.controller.js';

const router = express.Router();

// ── Static routes — must be before /:id ──────────────────────────────────────

router.get('/network/graph', enforceTenantScope, getNetworkGraph);

router.put('/bulk-status', requireTenantScopeMiddleware, requireTenantAdmin, validate(bulkUpdateStatusSchema), bulkUpdateStatus);

// ── Epic CRUD ─────────────────────────────────────────────────────────────────

router.get('/',    enforceTenantScope, listEpics);
router.post('/',   requireTenantScopeMiddleware, requireTenantAdmin, validate(createEpicSchema), createEpic);

router.get('/:id',    getEpic);
router.put('/:id',    requireTenantAdmin, validate(updateEpicSchema), updateEpic);
router.delete('/:id', requireTenantAdmin, deleteEpic);

// ── Feature linking ───────────────────────────────────────────────────────────

router.post('/:id/features',              requireTenantAdmin, validate(linkFeatureSchema), linkFeature);
router.put('/:id/features/reorder',       requireTenantAdmin, validate(reorderFeaturesSchema), reorderFeatures);
router.delete('/:id/features/:featureId', requireTenantAdmin, unlinkFeature);

// ── Dependencies ──────────────────────────────────────────────────────────────

router.post('/:id/blockers',              requireTenantAdmin, validate(addBlockerSchema), addBlocker);
router.delete('/:id/blockers/:blockerId', requireTenantAdmin, removeBlocker);

// ── Linked tickets ────────────────────────────────────────────────────────────

router.get('/:id/tickets',              listLinkedTickets);
router.post('/:id/tickets',             requireTenantAdmin, validate(linkTicketSchema), linkTicket);
router.delete('/:id/tickets/:ticketId', requireTenantAdmin, unlinkTicket);

// ── Sub-epics ─────────────────────────────────────────────────────────────────

router.get('/:id/sub-epics', listSubEpics);

// ── Relations ─────────────────────────────────────────────────────────────────

router.get('/:id/relations',                requireTenantAdmin, listRelations);
router.post('/:id/relations',               requireTenantAdmin, validate(addRelationSchema), addRelation);
router.delete('/:id/relations/:relationId', requireTenantAdmin, removeRelation);

// ── Auto-close check ──────────────────────────────────────────────────────────

router.get('/:id/auto-close', checkAutoClose);

// ── Burndown chart ────────────────────────────────────────────────────────────

router.get('/:id/burndown', getEpicBurndown);

export default router;
