import express from 'express';
import * as remindersController from './reminders.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  updateReminderSettingsSchema,
  updateEscalationSettingsSchema,
  updateSlaSettingsSchema,
  updateEpicAutoCloseSchema,
  updateDateFormatSchema,
} from './reminders.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: Reminder settings, delayed tickets, and tenant configuration
 */

// ── User reminder settings ────────────────────────────────────────────────────

/**
 * @swagger
 * /reminders/settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get reminder settings for the current user
 *     responses:
 *       200:
 *         description: '{ reminderEnabled: boolean, reminderInterval: number }'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Reminders]
 *     summary: Update reminder settings for the current user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reminderEnabled:  { type: boolean }
 *               reminderInterval: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Updated settings
 */
router.get('/settings', authenticateToken, remindersController.getReminderSettings);
router.put('/settings', authenticateToken, validate(updateReminderSettingsSchema), remindersController.updateReminderSettings);

/**
 * @swagger
 * /reminders/delayed-tickets:
 *   get:
 *     tags: [Reminders]
 *     summary: Get delayed tickets assigned to the current user
 *     description: Returns empty array if reminders are disabled for the user.
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TicketList'
 */
router.get('/delayed-tickets', authenticateToken, remindersController.getDelayedTickets);

// ── Escalation settings (admin only) ─────────────────────────────────────────

/**
 * @swagger
 * /reminders/escalate-now:
 *   post:
 *     tags: [Reminders]
 *     summary: Manually trigger priority escalation (ADMIN)
 *     responses:
 *       200:
 *         description: Escalation triggered
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/escalate-now', authenticateToken, requireAdmin, remindersController.triggerEscalation);

/**
 * @swagger
 * /reminders/escalation-settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get escalation interval (ADMIN)
 *     description: SUPER_ADMIN gets global interval; TENANT_ADMIN gets their tenant's setting.
 *     responses:
 *       200:
 *         description: '{ intervalMinutes: number, scope: "global" | "tenant" }'
 *   put:
 *     tags: [Reminders]
 *     summary: Update escalation interval (ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [intervalMinutes]
 *             properties:
 *               intervalMinutes: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Updated interval
 */
router.get('/escalation-settings', authenticateToken, requireAdmin, remindersController.getEscalationSettings);
router.put('/escalation-settings', authenticateToken, requireAdmin, validate(updateEscalationSettingsSchema), remindersController.updateEscalationSettings);

// ── SLA settings (admin only) ─────────────────────────────────────────────────

/**
 * @swagger
 * /reminders/sla-settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get SLA hour thresholds for the current tenant (ADMIN)
 *     responses:
 *       200:
 *         description: SLA settings
 *   put:
 *     tags: [Reminders]
 *     summary: Update SLA hour thresholds (ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slaUrgentHours:  { type: integer, minimum: 1 }
 *               slaHighHours:    { type: integer, minimum: 1 }
 *               slaMediumHours:  { type: integer, minimum: 1 }
 *               slaLowHours:     { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Updated SLA settings
 */
router.get('/sla-settings', authenticateToken, requireAdmin, remindersController.getSlaSettings);
router.put('/sla-settings', authenticateToken, requireAdmin, validate(updateSlaSettingsSchema), remindersController.updateSlaSettings);

// ── Epic auto-close settings (admin only) ─────────────────────────────────────

/**
 * @swagger
 * /reminders/epic-auto-close-settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get epic auto-close setting for the current tenant (ADMIN)
 *     responses:
 *       200:
 *         description: '{ epicAutoClose: boolean }'
 *   put:
 *     tags: [Reminders]
 *     summary: Update epic auto-close setting (ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [epicAutoClose]
 *             properties:
 *               epicAutoClose: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated setting
 */
router.get('/epic-auto-close-settings', authenticateToken, requireAdmin, remindersController.getEpicAutoCloseSettings);
router.put('/epic-auto-close-settings', authenticateToken, requireAdmin, validate(updateEpicAutoCloseSchema), remindersController.updateEpicAutoCloseSettings);

// ── Date format settings (admin only) ────────────────────────────────────────

/**
 * @swagger
 * /reminders/date-format-settings:
 *   get:
 *     tags: [Reminders]
 *     summary: Get date format for the current tenant (ADMIN)
 *     responses:
 *       200:
 *         description: '{ dateFormat: string }'
 *   put:
 *     tags: [Reminders]
 *     summary: Update date format (ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dateFormat]
 *             properties:
 *               dateFormat:
 *                 type: string
 *                 enum: [dd/MM/yyyy, MM/dd/yyyy, yyyy-MM-dd, dd-MM-yyyy, MM-dd-yyyy, "d MMM yyyy", "MMM d, yyyy"]
 *     responses:
 *       200:
 *         description: Updated date format
 */
router.get('/date-format-settings', authenticateToken, requireAdmin, remindersController.getDateFormatSettings);
router.put('/date-format-settings', authenticateToken, requireAdmin, validate(updateDateFormatSchema), remindersController.updateDateFormatSettings);

export default router;
