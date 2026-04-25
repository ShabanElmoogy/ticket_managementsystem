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

router.get('/settings', authenticateToken, remindersController.getReminderSettings);
router.put('/settings', authenticateToken, validate(updateReminderSettingsSchema), remindersController.updateReminderSettings);

router.get('/delayed-tickets', authenticateToken, remindersController.getDelayedTickets);

// ── Escalation settings (admin only) ─────────────────────────────────────────

router.post('/escalate-now', authenticateToken, requireAdmin, remindersController.triggerEscalation);

router.get('/escalation-settings', authenticateToken, requireAdmin, remindersController.getEscalationSettings);
router.put('/escalation-settings', authenticateToken, requireAdmin, validate(updateEscalationSettingsSchema), remindersController.updateEscalationSettings);

// ── SLA settings (admin only) ─────────────────────────────────────────────────

router.get('/sla-settings', authenticateToken, requireAdmin, remindersController.getSlaSettings);
router.put('/sla-settings', authenticateToken, requireAdmin, validate(updateSlaSettingsSchema), remindersController.updateSlaSettings);

// ── Epic auto-close settings (admin only) ─────────────────────────────────────

router.get('/epic-auto-close-settings', authenticateToken, requireAdmin, remindersController.getEpicAutoCloseSettings);
router.put('/epic-auto-close-settings', authenticateToken, requireAdmin, validate(updateEpicAutoCloseSchema), remindersController.updateEpicAutoCloseSettings);

// ── Date format settings (admin only) ────────────────────────────────────────

router.get('/date-format-settings', authenticateToken, requireAdmin, remindersController.getDateFormatSettings);
router.put('/date-format-settings', authenticateToken, requireAdmin, validate(updateDateFormatSchema), remindersController.updateDateFormatSettings);

export default router;
