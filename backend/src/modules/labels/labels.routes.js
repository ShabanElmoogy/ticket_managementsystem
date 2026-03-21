import express from 'express';
import * as labelsController from './labels.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Label Routes
router.get('/', authenticateToken, labelsController.getAllLabels);
router.post('/', authenticateToken, requireTenantAdmin, labelsController.createLabel);
router.put('/:id', authenticateToken, requireTenantAdmin, labelsController.updateLabel);
router.delete('/:id', authenticateToken, requireTenantAdmin, labelsController.deleteLabel);

// Ticket Label Assignment
router.post('/assign', authenticateToken, labelsController.addLabelToTicket);
router.delete('/:labelId/tickets/:ticketId', authenticateToken, labelsController.removeLabelFromTicket);

export default router;