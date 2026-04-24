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

/**
 * @swagger
 * /epics/network/graph:
 *   get:
 *     tags: [Epics]
 *     summary: Network graph of all epics (nodes + edges)
 *     responses:
 *       200:
 *         description: Graph data
 */
router.get('/network/graph', enforceTenantScope, getNetworkGraph);

/**
 * @swagger
 * /epics/bulk-status:
 *   put:
 *     tags: [Epics]
 *     summary: Bulk update epic status (TENANT_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, status]
 *             properties:
 *               ids:    { type: array, items: { type: string, format: uuid } }
 *               status: { type: string, enum: [DRAFT, ACTIVE, COMPLETED, CANCELLED] }
 *     responses:
 *       200:
 *         description: Updated count
 */
router.put('/bulk-status', requireTenantScopeMiddleware, requireTenantAdmin, validate(bulkUpdateStatusSchema), bulkUpdateStatus);

// ── Epic CRUD ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /epics:
 *   get:
 *     tags: [Epics]
 *     summary: List all epics (tenant-scoped)
 *     responses:
 *       200:
 *         description: Epic list with progress + hierarchy
 *   post:
 *     tags: [Epics]
 *     summary: Create an epic (TENANT_ADMIN)
 *     responses:
 *       201:
 *         description: Created epic
 */
router.get('/',    enforceTenantScope, listEpics);
router.post('/',   requireTenantScopeMiddleware, requireTenantAdmin, validate(createEpicSchema), createEpic);

/**
 * @swagger
 * /epics/{id}:
 *   get:
 *     tags: [Epics]
 *     summary: Get epic detail (features, sub-epics, ancestors, dependencies)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Epic detail
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Epics]
 *     summary: Update an epic (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated epic
 *   delete:
 *     tags: [Epics]
 *     summary: Delete an epic (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get('/:id',    getEpic);
router.put('/:id',    requireTenantAdmin, validate(updateEpicSchema), updateEpic);
router.delete('/:id', requireTenantAdmin, deleteEpic);

// ── Feature linking ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /epics/{id}/features:
 *   post:
 *     tags: [Epics]
 *     summary: Link a feature to an epic (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Feature linked
 */
router.post('/:id/features',              requireTenantAdmin, validate(linkFeatureSchema), linkFeature);
router.put('/:id/features/reorder',       requireTenantAdmin, validate(reorderFeaturesSchema), reorderFeatures);
router.delete('/:id/features/:featureId', requireTenantAdmin, unlinkFeature);

// ── Dependencies ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /epics/{id}/blockers:
 *   post:
 *     tags: [Epics]
 *     summary: Add a blocker dependency (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Blocker added
 */
router.post('/:id/blockers',              requireTenantAdmin, validate(addBlockerSchema), addBlocker);
router.delete('/:id/blockers/:blockerId', requireTenantAdmin, removeBlocker);

// ── Linked tickets ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /epics/{id}/tickets:
 *   get:
 *     tags: [Epics]
 *     summary: List tickets linked to an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Ticket list
 */
router.get('/:id/tickets',              listLinkedTickets);
router.post('/:id/tickets',             requireTenantAdmin, validate(linkTicketSchema), linkTicket);
router.delete('/:id/tickets/:ticketId', requireTenantAdmin, unlinkTicket);

// ── Sub-epics ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /epics/{id}/sub-epics:
 *   get:
 *     tags: [Epics]
 *     summary: List direct child epics
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Sub-epic list
 */
router.get('/:id/sub-epics', listSubEpics);

// ── Relations ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /epics/{id}/relations:
 *   get:
 *     tags: [Epics]
 *     summary: List soft relations for an epic (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Relation list
 */
router.get('/:id/relations',                requireTenantAdmin, listRelations);
router.post('/:id/relations',               requireTenantAdmin, validate(addRelationSchema), addRelation);
router.delete('/:id/relations/:relationId', requireTenantAdmin, removeRelation);

// ── Auto-close check ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /epics/{id}/auto-close:
 *   get:
 *     tags: [Epics]
 *     summary: Check if an epic is eligible for auto-close
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Eligibility result
 */
router.get('/:id/auto-close', checkAutoClose);

// ── Burndown chart ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /epics/{id}/burndown:
 *   get:
 *     tags: [Epics]
 *     summary: Burndown chart data with velocity projection
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Burndown data points
 */
router.get('/:id/burndown', getEpicBurndown);

export default router;
