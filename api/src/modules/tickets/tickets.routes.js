import express from 'express';
import * as ticketController from './tickets.controller.js';
import { authenticateToken, requireTenantAdmin, requireAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { createTicketSchema, updateTicketSchema, ticketQuerySchema } from './tickets.validation.js';
import { upload } from '../attachments/attachments.upload.js';
import { uploadAttachments, getAttachments, deleteAttachment } from '../attachments/attachments.controller.js';
import { getWatchers, watchTicket, unwatchTicket } from './watchers.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket lifecycle management
 */

// authenticateToken must run before resolveTenant (which requires req.user)
router.use(authenticateToken, resolveTenant);

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
router.get('/', validate(ticketQuerySchema, 'query'), ticketController.getAllTickets);

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
router.get('/delayed', ticketController.getDelayedTickets);

// Watchers — must be before /:id to avoid route conflict
router.get('/:id/watchers',    getWatchers);
router.post('/:id/watch',      watchTicket);
router.delete('/:id/watch',    unwatchTicket);

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
router.get('/:id', ticketController.getTicketById);

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
router.post('/', requireTenantAdmin, validate(createTicketSchema), ticketController.createTicket);

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
router.put('/:id', validate(updateTicketSchema), ticketController.updateTicket);

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
router.delete('/:id', requireTenantAdmin, ticketController.deleteTicket);

router.patch('/bulk', requireAdmin, ticketController.bulkUpdateStatus);
router.patch('/:id/restore', requireTenantAdmin, ticketController.restoreTicket);
router.patch('/:id/reassign', requireTenantAdmin, ticketController.reassignTicket);

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
router.post('/:id/take', ticketController.takeTicket);

// Attachments — mounted here so :id param is in scope
router.get('/:id/attachments',                    getAttachments);
router.post('/:id/attachments',                   upload.array('files', 5), uploadAttachments);
router.delete('/:id/attachments/:attachmentId',   deleteAttachment);

export default router;
