/**
 * reminders.repository.js
 * All database queries for the reminders module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { users, tickets, tenants, customers, applications } from './reminders.schema.js';
import { eq, and, or, not, lt, desc, asc, inArray } from 'drizzle-orm';

// ── User reminder settings ────────────────────────────────────────────────────

/** Get reminder settings for a user, optionally scoped to a tenant. */
export async function findReminderSettings(userId, tenantId) {
  const where = tenantId
    ? and(eq(users.id, userId), eq(users.tenantId, tenantId))
    : eq(users.id, userId);

  const rows = await db
    .select({ reminderEnabled: users.reminderEnabled, reminderInterval: users.reminderInterval })
    .from(users)
    .where(where)
    .limit(1);

  return rows[0] ?? null;
}

/** Update reminder settings for a user, returns the updated fields. */
export async function updateReminderSettings(userId, tenantId, data) {
  const where = tenantId
    ? and(eq(users.id, userId), eq(users.tenantId, tenantId))
    : eq(users.id, userId);

  const [row] = await db
    .update(users)
    .set(data)
    .where(where)
    .returning({ reminderEnabled: users.reminderEnabled, reminderInterval: users.reminderInterval });

  return row ?? null;
}

// ── Delayed tickets ───────────────────────────────────────────────────────────

/**
 * Fetch delayed tickets assigned to a user.
 * Delayed = past due date OR not updated within the reminder interval.
 * Scoped to tenant via createdBy user join (tickets have no tenantId column).
 */
export async function findDelayedTickets(userId, tenantId, delayThreshold) {
  const now = new Date();

  const rows = await db
    .select({
      id:            tickets.id,
      title:         tickets.title,
      description:   tickets.description,
      status:        tickets.status,
      priority:      tickets.priority,
      dueDate:       tickets.dueDate,
      createdAt:     tickets.createdAt,
      updatedAt:     tickets.updatedAt,
      customerId:    tickets.customerId,
      applicationId: tickets.applicationId,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(
      and(
        eq(tickets.assignedToId, userId),
        ...(tenantId ? [eq(users.tenantId, tenantId)] : []),
        not(eq(tickets.status, 'CLOSED')),
        or(lt(tickets.dueDate, now), lt(tickets.updatedAt, delayThreshold)),
      ),
    )
    .orderBy(desc(tickets.priority), asc(tickets.dueDate));

  if (!rows.length) return [];

  // Batch-fetch related customer + application names
  const customerIds    = [...new Set(rows.map((t) => t.customerId).filter(Boolean))];
  const applicationIds = [...new Set(rows.map((t) => t.applicationId).filter(Boolean))];

  const [customersData, applicationsData] = await Promise.all([
    customerIds.length
      ? db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.id, customerIds))
      : [],
    applicationIds.length
      ? db.select({ id: applications.id, name: applications.name }).from(applications).where(inArray(applications.id, applicationIds))
      : [],
  ]);

  const customerMap    = Object.fromEntries(customersData.map((c) => [c.id, c]));
  const applicationMap = Object.fromEntries(applicationsData.map((a) => [a.id, a]));

  return rows.map((t) => ({
    ...t,
    customer:    t.customerId    ? (customerMap[t.customerId]       ?? null) : null,
    application: t.applicationId ? (applicationMap[t.applicationId] ?? null) : null,
  }));
}

// ── Tenant settings ───────────────────────────────────────────────────────────

/** Get escalation interval for a tenant. */
export async function findTenantEscalationInterval(tenantId) {
  const rows = await db
    .select({ escalationIntervalMinutes: tenants.escalationIntervalMinutes })
    .from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return rows[0] ?? null;
}

/** Update escalation interval for a tenant, returns updated value. */
export async function updateTenantEscalationInterval(tenantId, intervalMinutes) {
  const [row] = await db
    .update(tenants)
    .set({ escalationIntervalMinutes: intervalMinutes, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning({ escalationIntervalMinutes: tenants.escalationIntervalMinutes });
  return row ?? null;
}

/** Get SLA hour settings for a tenant. */
export async function findTenantSlaSettings(tenantId) {
  const rows = await db
    .select({
      slaUrgentHours: tenants.slaUrgentHours,
      slaHighHours:   tenants.slaHighHours,
      slaMediumHours: tenants.slaMediumHours,
      slaLowHours:    tenants.slaLowHours,
    })
    .from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return rows[0] ?? null;
}

/** Update SLA hour settings for a tenant, returns updated values. */
export async function updateTenantSlaSettings(tenantId, data) {
  const [row] = await db
    .update(tenants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning({
      slaUrgentHours: tenants.slaUrgentHours,
      slaHighHours:   tenants.slaHighHours,
      slaMediumHours: tenants.slaMediumHours,
      slaLowHours:    tenants.slaLowHours,
    });
  return row ?? null;
}

/** Get epic auto-close setting for a tenant. */
export async function findTenantEpicAutoClose(tenantId) {
  const rows = await db
    .select({ epicAutoClose: tenants.epicAutoClose })
    .from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return rows[0] ?? null;
}

/** Update epic auto-close setting for a tenant, returns updated value. */
export async function updateTenantEpicAutoClose(tenantId, epicAutoClose) {
  const [row] = await db
    .update(tenants)
    .set({ epicAutoClose, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning({ epicAutoClose: tenants.epicAutoClose });
  return row ?? null;
}

/** Get date format setting for a tenant. */
export async function findTenantDateFormat(tenantId) {
  const rows = await db
    .select({ dateFormat: tenants.dateFormat })
    .from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return rows[0] ?? null;
}

/** Update date format setting for a tenant, returns updated value. */
export async function updateTenantDateFormat(tenantId, dateFormat) {
  const [row] = await db
    .update(tenants)
    .set({ dateFormat, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning({ dateFormat: tenants.dateFormat });
  return row ?? null;
}
