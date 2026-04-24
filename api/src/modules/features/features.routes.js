import express from 'express';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import {
  createFeatureSchema, updateFeatureSchema,
  createStepSchema, updateStepSchema,
} from './features.validation.js';
import {
  listFeatures, getFeature, createFeature, updateFeature, deleteFeature, toggleVote,
  listSteps, createStep, updateStep, deleteStep,
} from './features.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Features
 *   description: Feature requests with voting and implementation steps
 */

router.use(authenticateToken);

// ── Feature CRUD ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /features:
 *   get:
 *     tags: [Features]
 *     summary: List feature requests (tenant-scoped, with vote counts)
 *     responses:
 *       200:
 *         description: Feature list
 *   post:
 *     tags: [Features]
 *     summary: Submit a feature request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:         { type: string, maxLength: 255 }
 *               description:   { type: string, maxLength: 5000 }
 *               applicationId: { type: string, format: uuid, nullable: true }
 *               customerId:    { type: string, format: uuid, nullable: true }
 *     responses:
 *       201:
 *         description: Created feature
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/',    enforceTenantScope, listFeatures);
router.post('/',   enforceTenantScope, validate(createFeatureSchema), createFeature);

/**
 * @swagger
 * /features/{id}:
 *   get:
 *     tags: [Features]
 *     summary: Get a feature request by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Feature with vote count
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Features]
 *     summary: Update a feature request (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Updated feature
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Features]
 *     summary: Delete a feature request (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id',    getFeature);
router.put('/:id',    requireTenantAdmin, validate(updateFeatureSchema), updateFeature);
router.delete('/:id', requireTenantAdmin, deleteFeature);

/**
 * @swagger
 * /features/{id}/vote:
 *   post:
 *     tags: [Features]
 *     summary: Toggle vote on a feature request (add if not voted, remove if voted)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: '{ voteCount: number, votedByMe: boolean }'
 */
router.post('/:id/vote', toggleVote);

// ── Feature steps ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /features/{id}/steps:
 *   get:
 *     tags: [Features]
 *     summary: List implementation steps for a feature
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Step list with enriched user + ticket data
 *   post:
 *     tags: [Features]
 *     summary: Add an implementation step
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:                { type: string, maxLength: 255 }
 *               description:          { type: string, nullable: true }
 *               assignedToId:         { type: string, format: uuid, nullable: true }
 *               assignedProgrammerId: { type: string, format: uuid, nullable: true }
 *               linkedTicketId:       { type: string, format: uuid, nullable: true }
 *     responses:
 *       201:
 *         description: Created step
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/:id/steps',  listSteps);
router.post('/:id/steps', validate(createStepSchema), createStep);

/**
 * @swagger
 * /features/{id}/steps/{stepId}:
 *   put:
 *     tags: [Features]
 *     summary: Update a step (triggers auto-promotion when all steps DONE)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: stepId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated step
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Features]
 *     summary: Delete a step
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: stepId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.put('/:id/steps/:stepId',    validate(updateStepSchema), updateStep);
router.delete('/:id/steps/:stepId', deleteStep);

export default router;
