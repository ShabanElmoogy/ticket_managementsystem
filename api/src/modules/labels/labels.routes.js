import express from 'express';
import * as labelsController from './labels.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createLabelSchema, updateLabelSchema, addLabelToTicketSchema } from './labels.validation.js';

const router = express.Router();

router.get('/',  authenticateToken, labelsController.getAllLabels);
router.post('/', authenticateToken, requireTenantAdmin, validate(createLabelSchema), labelsController.createLabel);

router.post('/assign', authenticateToken, validate(addLabelToTicketSchema), labelsController.addLabelToTicket);

router.put('/:id',    authenticateToken, requireTenantAdmin, validate(updateLabelSchema), labelsController.updateLabel);
router.delete('/:id', authenticateToken, requireTenantAdmin, labelsController.deleteLabel);

router.delete('/:labelId/tickets/:ticketId', authenticateToken, labelsController.removeLabelFromTicket);

export default router;
