import express from 'express';
import * as remindersController from './reminders.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
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

export default router;