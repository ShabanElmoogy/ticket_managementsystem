import express from 'express';
import * as ticketController from './tickets.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Ticket Routes
router.get('/', authenticateToken, ticketController.getAllTickets);
router.get('/delayed', authenticateToken, ticketController.getDelayedTickets);
router.get('/:id', authenticateToken, ticketController.getTicketById);
router.post('/', authenticateToken, requireTenantAdmin, ticketController.createTicket);
router.put('/:id', authenticateToken, ticketController.updateTicket);
router.delete('/:id', authenticateToken, requireTenantAdmin, ticketController.deleteTicket);
router.post('/:id/take', authenticateToken, ticketController.takeTicket);

export default router;