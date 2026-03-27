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
 *     summary: List all labels
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LabelList'
 *   post:
 *     tags: [Labels]
 *     summary: Create a label (TENANT_ADMIN)
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateLabel'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Label'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authenticateToken, labelsController.getAllLabels);
router.post('/', authenticateToken, requireTenantAdmin, validate(createLabelSchema), labelsController.createLabel);

/**
 * @swagger
 * /labels/assign:
 *   post:
 *     tags: [Labels]
 *     summary: Assign a label to a ticket
 *     requestBody:
 *       $ref: '#/components/requestBodies/AssignLabel'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
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
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateLabel'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Label'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Labels]
 *     summary: Delete a label (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/:id', authenticateToken, requireTenantAdmin, validate(updateLabelSchema), labelsController.updateLabel);
router.delete('/:id', authenticateToken, requireTenantAdmin, labelsController.deleteLabel);

/**
 * @swagger
 * /labels/{labelId}/tickets/{ticketId}:
 *   delete:
 *     tags: [Labels]
 *     summary: Remove a label from a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/PathLabelId'
 *       - $ref: '#/components/parameters/PathTicketId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 */
router.delete('/:labelId/tickets/:ticketId', authenticateToken, labelsController.removeLabelFromTicket);

export default router;