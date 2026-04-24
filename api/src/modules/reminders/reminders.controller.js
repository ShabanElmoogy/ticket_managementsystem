/**
 * reminders.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 */

import { handleError } from '../../errors/index.js';
import * as remindersService from './reminders.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const userId   = (req) => req.user?.userId ?? req.user?.id;
const tenantId = (req) => req.user?.tenantId ?? null;

// ── User reminder settings ────────────────────────────────────────────────────

export const getReminderSettings = async (req, res) => {
  try {
    res.json(await remindersService.getReminderSettings(userId(req), tenantId(req)));
  } catch (e) { handleError(res, e, 'Get reminder settings'); }
};

export const updateReminderSettings = async (req, res) => {
  try {
    res.json(await remindersService.updateReminderSettings(userId(req), tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Update reminder settings'); }
};

// ── Delayed tickets ───────────────────────────────────────────────────────────

export const getDelayedTickets = async (req, res) => {
  try {
    res.json(await remindersService.getDelayedTickets(userId(req), tenantId(req)));
  } catch (e) { handleError(res, e, 'Get delayed tickets'); }
};

// ── Escalation ────────────────────────────────────────────────────────────────

export const triggerEscalation = async (req, res) => {
  try {
    res.json(await remindersService.triggerEscalation());
  } catch (e) { handleError(res, e, 'Trigger escalation'); }
};

export const getEscalationSettings = async (req, res) => {
  try {
    res.json(await remindersService.getEscalationSettings(req.user.role, tenantId(req)));
  } catch (e) { handleError(res, e, 'Get escalation settings'); }
};

export const updateEscalationSettings = async (req, res) => {
  try {
    res.json(await remindersService.updateEscalationSettings(req.user.role, tenantId(req), req.body.intervalMinutes));
  } catch (e) { handleError(res, e, 'Update escalation settings'); }
};

// ── SLA settings ──────────────────────────────────────────────────────────────

export const getSlaSettings = async (req, res) => {
  try {
    res.json(await remindersService.getSlaSettings(tenantId(req)));
  } catch (e) { handleError(res, e, 'Get SLA settings'); }
};

export const updateSlaSettings = async (req, res) => {
  try {
    res.json(await remindersService.updateSlaSettings(tenantId(req), req.body));
  } catch (e) { handleError(res, e, 'Update SLA settings'); }
};

// ── Epic auto-close settings ──────────────────────────────────────────────────

export const getEpicAutoCloseSettings = async (req, res) => {
  try {
    res.json(await remindersService.getEpicAutoCloseSettings(tenantId(req)));
  } catch (e) { handleError(res, e, 'Get epic auto-close settings'); }
};

export const updateEpicAutoCloseSettings = async (req, res) => {
  try {
    res.json(await remindersService.updateEpicAutoCloseSettings(tenantId(req), req.body.epicAutoClose));
  } catch (e) { handleError(res, e, 'Update epic auto-close settings'); }
};

// ── Date format settings ──────────────────────────────────────────────────────

export const getDateFormatSettings = async (req, res) => {
  try {
    res.json(await remindersService.getDateFormatSettings(tenantId(req)));
  } catch (e) { handleError(res, e, 'Get date format settings'); }
};

export const updateDateFormatSettings = async (req, res) => {
  try {
    res.json(await remindersService.updateDateFormatSettings(tenantId(req), req.body.dateFormat));
  } catch (e) { handleError(res, e, 'Update date format settings'); }
};
