import express from 'express';
import * as labelController from '../controllers/labelController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Label Routes
router.get('/', authenticateToken, labelController.getAllLabels);
router.post('/', authenticateToken, requireAdmin, labelController.createLabel);
router.put('/:id', authenticateToken, requireAdmin, labelController.updateLabel);
router.delete('/:id', authenticateToken, requireAdmin, labelController.deleteLabel);

// Ticket Label Assignment
router.post('/assign', authenticateToken, labelController.addLabelToTicket);
router.delete('/:labelId/tickets/:ticketId', authenticateToken, labelController.removeLabelFromTicket);

export default router;