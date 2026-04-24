import express from 'express';
import * as labelsController from './labels.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createLabelSchema, updateLabelSchema, addLabelToTicketSchema } from './labels.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Labels
 *   description: Ticket labels
 */

/**
 * @swagger
 * /labels:
 *   get:
 *     tags: [Labels]
 *     summary: List all labels with ticket counts
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LabelList'
 *   post:
 *     tags: [Labels]
 *     summary: Create a label (TENANT_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, maxLength: 100 }
 *               color:       { type: string }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Label'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/',  authenticateToken, labelsController.getAllLabels);
router.post('/', authenticateToken, requireTenantAdmin, validate(createLabelSchema), labelsController.createLabel);

/**
 * @swagger
 * /labels/assign:
 *   post:
 *     tags: [Labels]
 *     summary: Assign a label to a ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticketId, labelId]
 *             properties:
 *               ticketId: { type: string, format: uuid }
 *               labelId:  { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Assignment with full label object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/assign', authenticateToken, validate(addLabelToTicketSchema), labelsController.addLabelToTicket);

/**
 * @swagger
 * /labels/{id}:
 *   put:
 *     tags: [Labels]
 *     summary: Update a label (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Label'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Labels]
 *     summary: Delete a label and remove it from all tickets (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/:id',    authenticateToken, requireTenantAdmin, validate(updateLabelSchema), labelsController.updateLabel);
router.delete('/:id', authenticateToken, requireTenantAdmin, labelsController.deleteLabel);

/**
 * @swagger
 * /labels/{labelId}/tickets/{ticketId}:
 *   delete:
 *     tags: [Labels]
 *     summary: Remove a label from a specific ticket
 *     parameters:
 *       - name: labelId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: ticketId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
router.delete('/:labelId/tickets/:ticketId', authenticateToken, labelsController.removeLabelFromTicket);

export default router;
