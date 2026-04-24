/**
 * applications.repository.js
 * All database queries for the applications module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { applications } from './applications.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { customers, customerApplications } from '../customers/customers.schema.js';
import { eq, desc, count, countDistinct, and } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

const APP_COLUMNS = {
  id:          applications.id,
  tenantId:    applications.tenantId,
  name:        applications.name,
  description: applications.description,
  version:     applications.version,
  createdAt:   applications.createdAt,
  updatedAt:   applications.updatedAt,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * List all applications, optionally scoped to a tenant.
 * Includes ticket + customer counts via JOIN — no N+1.
 */
export async function findAllApplications(tenantId) {
  return db
    .select({
      ...APP_COLUMNS,
      ticketCount:   countDistinct(tickets.id),
      customerCount: countDistinct(customerApplications.customerId),
    })
    .from(applications)
    .leftJoin(tickets, eq(tickets.applicationId, applications.id))
    .leftJoin(customerApplications, eq(customerApplications.applicationId, applications.id))
    .where(tenantId ? eq(applications.tenantId, tenantId) : undefined)
    .groupBy(applications.id)
    .orderBy(desc(applications.createdAt));
}

/** Find a single application by ID, optionally scoped to a tenant. */
export async function findApplicationById(id, tenantId) {
  const where = tenantId
    ? and(eq(applications.id, id), eq(applications.tenantId, tenantId))
    : eq(applications.id, id);

  const rows = await db
    .select(APP_COLUMNS)
    .from(applications)
    .where(where)
    .limit(1);

  return rows[0] ?? null;
}

/** Find an application by name within a tenant (duplicate check). */
export async function findApplicationByName(name, tenantId) {
  const where = tenantId
    ? and(eq(applications.name, name), eq(applications.tenantId, tenantId))
    : eq(applications.name, name);

  const rows = await db
    .select({ id: applications.id })
    .from(applications)
    .where(where)
    .limit(1);

  return rows[0] ?? null;
}

/** Get linked customers for an application. */
export async function findApplicationCustomers(applicationId, tenantId) {
  const where = tenantId
    ? and(eq(customerApplications.applicationId, applicationId), eq(customers.tenantId, tenantId))
    : eq(customerApplications.applicationId, applicationId);

  return db
    .select({ id: customers.id, name: customers.name, email: customers.email })
    .from(customerApplications)
    .innerJoin(customers, eq(customers.id, customerApplications.customerId))
    .where(where);
}

/** Get linked tickets for an application. */
export async function findApplicationTickets(applicationId, tenantId) {
  const where = tenantId
    ? and(eq(tickets.applicationId, applicationId), eq(users.tenantId, tenantId))
    : eq(tickets.applicationId, applicationId);

  return db
    .select({
      id:        tickets.id,
      title:     tickets.title,
      status:    tickets.status,
      priority:  tickets.priority,
      dueDate:   tickets.dueDate,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(where);
}

/** Count tickets linked to an application (used before delete). */
export async function countApplicationTickets(applicationId, tenantId) {
  const where = tenantId
    ? and(eq(tickets.applicationId, applicationId), eq(users.tenantId, tenantId))
    : eq(tickets.applicationId, applicationId);

  const [{ n }] = await db
    .select({ n: count() })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(where);

  return Number(n);
}

/** Insert a new application, returns the created row. */
export async function insertApplication(values) {
  const [app] = await db
    .insert(applications)
    .values(values)
    .returning(APP_COLUMNS);
  return app;
}

/** Update an application by ID (optionally tenant-scoped), returns the updated row. */
export async function updateApplicationById(id, tenantId, data) {
  const where = tenantId
    ? and(eq(applications.id, id), eq(applications.tenantId, tenantId))
    : eq(applications.id, id);

  const [app] = await db
    .update(applications)
    .set({ ...data, updatedAt: new Date() })
    .where(where)
    .returning(APP_COLUMNS);

  return app ?? null;
}

/** Delete an application by ID (optionally tenant-scoped). */
export async function deleteApplicationById(id, tenantId) {
  const where = tenantId
    ? and(eq(applications.id, id), eq(applications.tenantId, tenantId))
    : eq(applications.id, id);

  await db.delete(applications).where(where);
}

// ── Customer assignment ───────────────────────────────────────────────────────

/** Find an existing customer↔application assignment. */
export async function findAssignment(customerId, applicationId) {
  const rows = await db
    .select({ id: customerApplications.id })
    .from(customerApplications)
    .where(
      and(
        eq(customerApplications.customerId, customerId),
        eq(customerApplications.applicationId, applicationId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

/** Insert a customer↔application assignment. */
export async function insertAssignment(customerId, applicationId) {
  const [row] = await db
    .insert(customerApplications)
    .values({ customerId, applicationId })
    .returning();
  return row;
}

/** Delete a customer↔application assignment. */
export async function deleteAssignment(customerId, applicationId) {
  const [deleted] = await db
    .delete(customerApplications)
    .where(
      and(
        eq(customerApplications.customerId, customerId),
        eq(customerApplications.applicationId, applicationId),
      ),
    )
    .returning({ id: customerApplications.id });

  return deleted ?? null;
}

/** Verify a customer exists and belongs to the tenant. */
export async function findCustomerInTenant(customerId, tenantId) {
  const rows = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
    .limit(1);

  return rows[0] ?? null;
}
