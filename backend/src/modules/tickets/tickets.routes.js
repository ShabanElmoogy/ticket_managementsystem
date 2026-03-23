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
 *         schema: { type: string, enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TicketList'
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
 *         $ref: '#/components/responses/TicketList'
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
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Ticket'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
 *       $ref: '#/components/requestBodies/CreateTicket'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Ticket'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
 *       - $ref: '#/components/parameters/PathId'
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateTicket'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Ticket'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
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
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NoContent'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticateToken, requireTenantAdmin, ticketController.deleteTicket);

router.patch('/:id/restore', authenticateToken, requireTenantAdmin, ticketController.restoreTicket);

/**
 * @swagger
 * /tickets/{id}/take:
 *   post:
 *     tags: [Tickets]
 *     summary: Self-assign (take) a ticket
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantSlug'
 *       - $ref: '#/components/parameters/PathId'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Ticket'
 */
router.post('/:id/take', authenticateToken, ticketController.takeTicket);

export default router;
