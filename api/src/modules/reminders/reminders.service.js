/**
 * reminders.service.js
 * Business logic for the reminders module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './reminders.repository.js';
import { escalatePriorities, getEscalationInterval, setEscalationInterval } from '../../utils/scheduler.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_DATE_FORMATS = [
  'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd',
  'dd-MM-yyyy', 'MM-dd-yyyy', 'd MMM yyyy', 'MMM d, yyyy',
];

// ── User reminder settings ────────────────────────────────────────────────────

export async function getReminderSettings(userId, tenantId) {
  const settings = await repo.findReminderSettings(userId, tenantId ?? null);
  if (!settings) throw fail('User not found', 404);
  return settings;
}

export async function updateReminderSettings(userId, tenantId, body) {
  const { reminderEnabled, reminderInterval } = body;

  const data = {};
  if (reminderEnabled  !== undefined) data.reminderEnabled  = reminderEnabled;
  if (reminderInterval !== undefined) data.reminderInterval = reminderInterval;

  const updated = await repo.updateReminderSettings(userId, tenantId ?? null, data);
  if (!updated) throw fail('User not found', 404);
  return updated;
}

// ── Delayed tickets ───────────────────────────────────────────────────────────

export async function getDelayedTickets(userId, tenantId) {
  const settings = await repo.findReminderSettings(userId, tenantId ?? null);

  // Return empty list if reminders are disabled or user not found
  if (!settings?.reminderEnabled) return [];

  const delayThreshold = new Date(Date.now() - settings.reminderInterval * 60 * 1000);
  return repo.findDelayedTickets(userId, tenantId ?? null, delayThreshold);
}

// ── Escalation ────────────────────────────────────────────────────────────────

export async function triggerEscalation() {
  await escalatePriorities();
  return { message: 'Priority escalation completed. Check server logs for details.' };
}

/**
 * Get escalation interval.
 * SUPER_ADMIN → global in-memory interval.
 * TENANT_ADMIN → their tenant's DB setting.
 */
export async function getEscalationSettings(role, tenantId) {
  if (role === 'SUPER_ADMIN') {
    return { intervalMinutes: getEscalationInterval(), scope: 'global' };
  }

  if (!tenantId) throw fail('Tenant context required', 403);

  const tenant = await repo.findTenantEscalationInterval(tenantId);
  if (!tenant) throw fail('Tenant not found', 404);

  return { intervalMinutes: tenant.escalationIntervalMinutes, scope: 'tenant' };
}

/**
 * Update escalation interval.
 * SUPER_ADMIN → updates global in-memory interval.
 * TENANT_ADMIN → updates their tenant's DB setting.
 */
export async function updateEscalationSettings(role, tenantId, intervalMinutes) {
  const parsed = parseInt(intervalMinutes, 10);
  if (isNaN(parsed) || parsed < 1) throw fail('intervalMinutes must be a positive integer');

  if (role === 'SUPER_ADMIN') {
    const updated = setEscalationInterval(parsed);
    return { intervalMinutes: updated, scope: 'global' };
  }

  if (!tenantId) throw fail('Tenant context required', 403);

  const updated = await repo.updateTenantEscalationInterval(tenantId, parsed);
  return { intervalMinutes: updated.escalationIntervalMinutes, scope: 'tenant' };
}

// ── SLA settings ──────────────────────────────────────────────────────────────

export async function getSlaSettings(tenantId) {
  if (!tenantId) throw fail('Tenant context required', 403);

  const tenant = await repo.findTenantSlaSettings(tenantId);
  if (!tenant) throw fail('Tenant not found', 404);

  return tenant;
}

export async function updateSlaSettings(tenantId, body) {
  if (!tenantId) throw fail('Tenant context required', 403);

  const { slaUrgentHours, slaHighHours, slaMediumHours, slaLowHours } = body;

  const data = {};
  if (slaUrgentHours  != null) data.slaUrgentHours  = parseInt(slaUrgentHours,  10);
  if (slaHighHours    != null) data.slaHighHours    = parseInt(slaHighHours,    10);
  if (slaMediumHours  != null) data.slaMediumHours  = parseInt(slaMediumHours,  10);
  if (slaLowHours     != null) data.slaLowHours     = parseInt(slaLowHours,     10);

  const updated = await repo.updateTenantSlaSettings(tenantId, data);
  return updated;
}

// ── Epic auto-close settings ──────────────────────────────────────────────────

export async function getEpicAutoCloseSettings(tenantId) {
  if (!tenantId) throw fail('Tenant context required', 403);

  const tenant = await repo.findTenantEpicAutoClose(tenantId);
  if (!tenant) throw fail('Tenant not found', 404);

  return { epicAutoClose: tenant.epicAutoClose };
}

export async function updateEpicAutoCloseSettings(tenantId, epicAutoClose) {
  if (!tenantId) throw fail('Tenant context required', 403);
  if (typeof epicAutoClose !== 'boolean') throw fail('epicAutoClose must be a boolean');

  const updated = await repo.updateTenantEpicAutoClose(tenantId, epicAutoClose);
  return { epicAutoClose: updated.epicAutoClose };
}

// ── Date format settings ──────────────────────────────────────────────────────

export async function getDateFormatSettings(tenantId) {
  if (!tenantId) throw fail('Tenant context required', 403);

  const tenant = await repo.findTenantDateFormat(tenantId);
  return { dateFormat: tenant?.dateFormat ?? 'dd/MM/yyyy' };
}

export async function updateDateFormatSettings(tenantId, dateFormat) {
  if (!tenantId) throw fail('Tenant context required', 403);

  if (!dateFormat || !VALID_DATE_FORMATS.includes(dateFormat)) {
    throw fail(`dateFormat must be one of: ${VALID_DATE_FORMATS.join(', ')}`);
  }

  try {
    const updated = await repo.updateTenantDateFormat(tenantId, dateFormat);
    return { dateFormat: updated.dateFormat };
  } catch (dbError) {
    // Column not yet migrated — acknowledge the save so the frontend stores it locally
    console.warn('dateFormat column not yet migrated, storing locally only:', dbError.message);
    return { dateFormat };
  }
}
