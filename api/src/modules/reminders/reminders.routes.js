import express from 'express';
import * as remindersController from './reminders.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateReminderSettingsSchema } from './reminders.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: Reminder settings and delayed ticket alerts
 */

/**
 * @swagger
 * /reminders/settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get reminder settings for the current user
 *     responses:
 *       200:
 *         description: Reminder settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReminderSettings'
 *   put:
 *     tags: [Reminders]
 *     summary: Update reminder settings
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateReminderSettings'
 *     responses:
 *       200:
 *         description: Updated settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReminderSettings'
 */
router.get('/settings', authenticateToken, remindersController.getReminderSettings);
router.put('/settings', authenticateToken, validate(updateReminderSettingsSchema), remindersController.updateReminderSettings);

/**
 * @swagger
 * /reminders/delayed-tickets:
 *   get:
 *     tags: [Reminders]
 *     summary: Get delayed tickets assigned to the current user
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TicketList'
 */
router.get('/delayed-tickets', authenticateToken, remindersController.getDelayedTickets);

// Manually trigger priority escalation — admin only
router.post('/escalate-now', authenticateToken, requireAdmin, remindersController.triggerEscalation);

// Escalation interval settings — admin only
router.get('/escalation-settings', authenticateToken, requireAdmin, remindersController.getEscalationSettings);
router.put('/escalation-settings', authenticateToken, requireAdmin, remindersController.updateEscalationSettings);

router.get('/sla-settings', authenticateToken, requireAdmin, remindersController.getSlaSettings);
router.put('/sla-settings', authenticateToken, requireAdmin, remindersController.updateSlaSettings);

export default router;