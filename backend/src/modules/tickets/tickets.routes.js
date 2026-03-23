import express from 'express';
import * as ticketController from './tickets.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { createTicketSchema, updateTicketSchema, ticketQuerySchema } from './tickets.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket lifecycle management
 */

// Resolve tenant context from headers/params (X-Tenant-Slug / X-Tenant-Id)
router.use(resolveTenant);

/**
 * @swagger
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: List all tickets (tenant-scoped)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Array of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 */
router.get('/', authenticateToken, validate(ticketQuerySchema, 'query'), ticketController.getAllTickets);

/**
 * @swagger
 * /tickets/delayed:
 *   get:
 *     tags: [Tickets]
 *     summary: List overdue / delayed tickets
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     responses:
 *       200:
 *         description: Array of delayed tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 */
router.get('/delayed', authenticateToken, ticketController.getDelayedTickets);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get a ticket by ID
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticateToken, ticketController.getTicketById);

/**
 * @swagger
 * /tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Create a ticket (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:          { type: string }
 *               description:    { type: string }
 *               priority:       { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *               assignedToId:   { type: string, format: uuid, nullable: true }
 *               customerId:     { type: string, format: uuid, nullable: true }
 *               applicationId:  { type: string, format: uuid, nullable: true }
 *               dueDate:        { type: string, format: date-time, nullable: true }
 *               estimatedHours: { type: number, nullable: true }
 *     responses:
 *       201:
 *         description: Created ticket
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 */
router.post('/', authenticateToken, requireTenantAdmin, validate(createTicketSchema), ticketController.createTicket);

/**
 * @swagger
 * /tickets/{id}:
 *   put:
 *     tags: [Tickets]
 *     summary: Update a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
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
 *               title:          { type: string }
 *               status:         { type: string, enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED] }
 *               priority:       { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *               assignedToId:   { type: string, format: uuid, nullable: true }
 *               dueDate:        { type: string, format: date-time, nullable: true }
 *               actualHours:    { type: number, nullable: true }
 *     responses:
 *       200:
 *         description: Updated ticket
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 */
router.put('/:id', authenticateToken, validate(updateTicketSchema), ticketController.updateTicket);

/**
 * @swagger
 * /tickets/{id}:
 *   delete:
 *     tags: [Tickets]
 *     summary: Delete a ticket (TENANT_ADMIN)
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, requireTenantAdmin, ticketController.deleteTicket);

/**
 * @swagger
 * /tickets/{id}/take:
 *   post:
 *     tags: [Tickets]
 *     summary: Self-assign (take) a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 */
router.post('/:id/take', authenticateToken, ticketController.takeTicket);

export default router;
