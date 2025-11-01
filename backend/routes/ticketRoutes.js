import express from 'express';
import * as ticketController from '../controllers/ticketController.js';
import * as commentController from '../controllers/commentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Ticket Routes
router.get('/', authenticateToken, ticketController.getAllTickets);
router.get('/delayed', authenticateToken, ticketController.getDelayedTickets);
router.get('/:id', authenticateToken, ticketController.getTicketById);
router.post('/', authenticateToken, requireAdmin, ticketController.createTicket);
router.put('/:id', authenticateToken, ticketController.updateTicket);
router.delete('/:id', authenticateToken, requireAdmin, ticketController.deleteTicket);
router.post('/:id/take', authenticateToken, ticketController.takeTicket);

// Comment Routes
router.post('/:id/comments', authenticateToken, commentController.createComment);

export default router;