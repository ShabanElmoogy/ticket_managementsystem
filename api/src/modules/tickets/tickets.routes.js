import express from 'express';
import * as ticketController from './tickets.controller.js';
import { authenticateToken, requireTenantAdmin, requireAdmin } from '../../middleware/auth.js';
import { enforceTenantScope, requireTenantScopeMiddleware } from '../../utils/tenantUtils.js';
import { validate } from '../../middleware/validate.js';
import { createTicketSchema, updateTicketSchema, ticketQuerySchema, bulkUpdateStatusSchema, reassignTicketSchema } from './tickets.validation.js';
import { upload } from '../attachments/attachments.upload.js';
import { uploadAttachments, getAttachments, deleteAttachment } from '../attachments/attachments.controller.js';
import watchersRouter from './watchers/watchers.routes.js';

const router = express.Router();

// authenticateToken runs on every ticket route
router.use(authenticateToken);

router.get('/',      enforceTenantScope, validate(ticketQuerySchema, 'query'), ticketController.getAllTickets);
router.get('/delayed', enforceTenantScope, ticketController.getDelayedTickets);

// Watchers — must be before /:id to avoid route conflict
router.use('/', watchersRouter);

router.get('/:id',    enforceTenantScope, ticketController.getTicketById);
router.post('/',      requireTenantScopeMiddleware, requireTenantAdmin, validate(createTicketSchema), ticketController.createTicket);
router.put('/:id',    enforceTenantScope, validate(updateTicketSchema), ticketController.updateTicket);
router.delete('/:id', requireTenantScopeMiddleware, requireTenantAdmin, ticketController.deleteTicket);

router.patch('/bulk',         requireAdmin, validate(bulkUpdateStatusSchema), ticketController.bulkUpdateStatus);
router.patch('/:id/restore',  requireTenantScopeMiddleware, requireTenantAdmin, ticketController.restoreTicket);
router.patch('/:id/reassign', requireTenantScopeMiddleware, requireTenantAdmin, validate(reassignTicketSchema), ticketController.reassignTicket);
router.post('/:id/take',      enforceTenantScope, ticketController.takeTicket);

// Attachments
router.get('/:id/attachments',                  getAttachments);
router.post('/:id/attachments',                 upload.array('files', 5), uploadAttachments);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

export default router;
