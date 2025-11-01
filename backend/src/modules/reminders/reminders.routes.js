import express from 'express';
import * as remindersController from './reminders.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Get reminder settings
router.get('/settings', authenticateToken, remindersController.getReminderSettings);

// Update reminder settings
router.put('/settings', authenticateToken, remindersController.updateReminderSettings);

// Get delayed tickets
router.get('/delayed-tickets', authenticateToken, remindersController.getDelayedTickets);

export default router;