/**
 * epicContributors/epicContributors.routes.js
 * Contributors on an epic.
 * Mounted at /epics by the top-level router.
 */

import express from 'express';
import { requireTenantAdmin } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { addContributorSchema, updateContributorSchema } from './epicContributors.validation.js';
import { listContributors, addContributor, updateContributor, removeContributor } from './epicContributors.controller.js';

const router = express.Router();

/**
 * @swagger
 * /epics/{id}/contributors:
 *   get:
 *     tags: [Epics]
 *     summary: List contributors on an epic
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Contributor list
 *   post:
 *     tags: [Epics]
 *     summary: Add a contributor (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               role:   { type: string, enum: [PM, TECH_LEAD, DESIGNER, DEVELOPER, QA, DEVOPS, ANALYST, STAKEHOLDER, OTHER] }
 *     responses:
 *       201:
 *         description: Contributor added
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/contributors',  listContributors);
router.post('/:id/contributors', requireTenantAdmin, validate(addContributorSchema), addContributor);

/**
 * @swagger
 * /epics/{id}/contributors/{contributorId}:
 *   put:
 *     tags: [Epics]
 *     summary: Update contributor role (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: contributorId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated contributor
 *   delete:
 *     tags: [Epics]
 *     summary: Remove a contributor (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *       - name: contributorId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Removed
 */
router.put('/:id/contributors/:contributorId',    requireTenantAdmin, validate(updateContributorSchema), updateContributor);
router.delete('/:id/contributors/:contributorId', requireTenantAdmin, removeContributor);

export default router;
