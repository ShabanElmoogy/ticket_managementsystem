import express from 'express';
import { getReminderSettings, updateReminderSettings, getDelayedTickets } from '../controllers/reminderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get reminder settings
router.get('/settings', authenticateToken, getReminderSettings);

// Update reminder settings
router.put('/settings', authenticateToken, updateReminderSettings);

// Get delayed tickets
router.get('/delayed-tickets', authenticateToken, getDelayedTickets);

export default router;