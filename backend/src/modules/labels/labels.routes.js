import express from 'express';
import * as labelsController from './labels.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Label Routes
router.get('/', authenticateToken, labelsController.getAllLabels);
router.post('/', authenticateToken, requireAdmin, labelsController.createLabel);
router.put('/:id', authenticateToken, requireAdmin, labelsController.updateLabel);
router.delete('/:id', authenticateToken, requireAdmin, labelsController.deleteLabel);

// Ticket Label Assignment
router.post('/assign', authenticateToken, labelsController.addLabelToTicket);
router.delete('/:labelId/tickets/:ticketId', authenticateToken, labelsController.removeLabelFromTicket);

export default router;