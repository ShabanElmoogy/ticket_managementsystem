import express from 'express';
import { authenticateToken, requireAdmin, requireProgrammerOrAdmin } from '../../middleware/auth.js';
import { requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { upsertProgrammingSchema, assignProgrammerSchema } from './programming.validation.js';
import * as ctrl from './programming.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Programming
 *   description: Programming details and programmer assignment for tickets
 */

// All programming routes require authentication + a resolved tenant scope
router.use(authenticateToken, requireTenantScopeMiddleware);

/**
 * @swagger
 * /tickets/{id}/programming:
 *   get:
 *     tags: [Programming]
 *     summary: Get programming details for a ticket (PROGRAMMER or ADMIN)
 *     description: >
 *       PROGRAMMER role can only access details for tickets assigned to them.
 *       Returns null if no programming details exist yet.
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         description: Programming details or null
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Programming]
 *     summary: Upsert programming details for a ticket (PROGRAMMER or ADMIN)
 *     description: Creates or updates the programming details row for the ticket.
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               technicalDescription: { type: string }
 *               rootCause:            { type: string }
 *               stepsToReproduce:     { type: string }
 *               solutionSteps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     order: { type: integer }
 *                     text:  { type: string }
 *                     done:  { type: boolean }
 *               codeSnippets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     language: { type: string }
 *                     code:     { type: string }
 *                     label:    { type: string }
 *               estimatedHours: { type: number }
 *               actualHours:    { type: number }
 *     responses:
 *       200:
 *         description: Saved programming details
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/programming', requireProgrammerOrAdmin, ctrl.getProgrammingDetails);
router.put('/:id/programming', requireProgrammerOrAdmin, validate(upsertProgrammingSchema), ctrl.upsertProgrammingDetails);

/**
 * @swagger
 * /tickets/{id}/assign-programmer:
 *   post:
 *     tags: [Programming]
 *     summary: Assign a programmer to a ticket (ADMIN only)
 *     description: >
 *       Sets the ticket's programmerId and status to PROGRAMMING.
 *       Emits a TICKET_ASSIGNED notification to all tenant users.
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [programmerId]
 *             properties:
 *               programmerId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated ticket
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/assign-programmer', requireAdmin, validate(assignProgrammerSchema), ctrl.assignProgrammer);

export default router;
