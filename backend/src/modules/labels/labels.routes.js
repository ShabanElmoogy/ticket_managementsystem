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
 *         description: Array of labels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Label'
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
 *               name:  { type: string }
 *               color: { type: string }
 *     responses:
 *       201:
 *         description: Created label
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Label'
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [labelId, ticketId]
 *             properties:
 *               labelId:  { type: string, format: uuid }
 *               ticketId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Assigned
 */
router.post('/assign', authenticateToken, validate(addLabelToTicketSchema), labelsController.addLabelToTicket);

/**
 * @swagger
 * /labels/{id}:
 *   put:
 *     tags: [Labels]
 *     summary: Update a label (TENANT_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               color: { type: string }
 *     responses:
 *       200:
 *         description: Updated label
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Label'
 *   delete:
 *     tags: [Labels]
 *     summary: Delete a label (TENANT_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
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
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Removed
 */
router.delete('/:labelId/tickets/:ticketId', authenticateToken, labelsController.removeLabelFromTicket);

export default router;