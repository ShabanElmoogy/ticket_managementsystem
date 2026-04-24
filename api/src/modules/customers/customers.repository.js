/**
 * customers.repository.js
 * All database queries for the customers module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { customers, customerApplications } from './customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, desc, count, inArray } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

const CUSTOMER_COLUMNS = {
  id:                    customers.id,
  tenantId:              customers.tenantId,
  name:                  customers.name,
  email:                 customers.email,
  phone:                 customers.phone,
  company:               customers.company,
  address:               customers.address,
  maintenanceType:       customers.maintenanceType,
  subscriptionStartDate: customers.subscriptionStartDate,
  subscriptionEndDate:   customers.subscriptionEndDate,
  createdAt:             customers.createdAt,
  updatedAt:             customers.updatedAt,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * List all customers, optionally scoped to a tenant.
 * Returns customers only — applications and ticket counts are fetched separately.
 */
export async function findAllCustomers(tenantId) {
  return db
    .select(CUSTOMER_COLUMNS)
    .from(customers)
    .where(tenantId ? eq(customers.tenantId, tenantId) : undefined)
    .orderBy(desc(customers.createdAt));
}

/** Find a single customer by ID, optionally scoped to a tenant. */
export async function findCustomerById(id, tenantId) {
  const where = tenantId
    ? and(eq(customers.id, id), eq(customers.tenantId, tenantId))
    : eq(customers.id, id);

  const rows = await db
    .select(CUSTOMER_COLUMNS)
    .from(customers)
    .where(where)
    .limit(1);

  return rows[0] ?? null;
}

/** Find a customer by email within a tenant (duplicate check). */
export async function findCustomerByEmail(email, tenantId) {
  const rows = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.email, email), eq(customers.tenantId, tenantId)))
    .limit(1);

  return rows[0] ?? null;
}

/** Insert a new customer, returns the created row. */
export async function insertCustomer(values) {
  const [customer] = await db
    .insert(customers)
    .values(values)
    .returning(CUSTOMER_COLUMNS);
  return customer;
}

/** Update a customer by ID (tenant-scoped), returns the updated row. */
export async function updateCustomerById(id, tenantId, data) {
  const [customer] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
    .returning(CUSTOMER_COLUMNS);

  return customer ?? null;
}

/** Delete a customer by ID (tenant-scoped). */
export async function deleteCustomerById(id, tenantId) {
  await db.delete(customers).where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
}

// ── Batch counts (no N+1) ─────────────────────────────────────────────────────

/**
 * Get applications and ticket counts for multiple customers in 2 queries.
 * Returns a map: { customerId: { applications: [...], ticketCount: number } }
 */
export async function getBatchCustomerDetails(customerIds) {
  if (!customerIds.length) return {};

  const [appRows, ticketRows] = await Promise.all([
    // All customer-application assignments with application details
    db
      .select({
        customerId:    customerApplications.customerId,
        id:            customerApplications.id,
        assignedAt:    customerApplications.assignedAt,
        applicationId: applications.id,
        appName:       applications.name,
        appVersion:    applications.version,
      })
      .from(customerApplications)
      .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
      .where(inArray(customerApplications.customerId, customerIds)),

    // Ticket counts per customer
    db
      .select({ customerId: tickets.customerId, count: count() })
      .from(tickets)
      .where(inArray(tickets.customerId, customerIds))
      .groupBy(tickets.customerId),
  ]);

  // Build the result map
  const result = {};
  for (const id of customerIds) {
    result[id] = {
      applications: appRows
        .filter((r) => r.customerId === id)
        .map((r) => ({
          id:          r.id,
          assignedAt:  r.assignedAt,
          application: {
            id:      r.applicationId,
            name:    r.appName,
            version: r.appVersion,
          },
        })),
      ticketCount: Number(ticketRows.find((r) => r.customerId === id)?.count ?? 0),
    };
  }

  return result;
}

/** Get linked applications for a single customer. */
export async function findCustomerApplications(customerId) {
  return db
    .select({
      id:         customerApplications.id,
      assignedAt: customerApplications.assignedAt,
      application: {
        id:      applications.id,
        name:    applications.name,
        version: applications.version,
      },
    })
    .from(customerApplications)
    .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
    .where(eq(customerApplications.customerId, customerId));
}

/** Get linked tickets for a single customer. */
export async function findCustomerTickets(customerId) {
  return db
    .select({
      id:          tickets.id,
      title:       tickets.title,
      description: tickets.description,
      status:      tickets.status,
      priority:    tickets.priority,
      dueDate:     tickets.dueDate,
      createdAt:   tickets.createdAt,
      assignedTo: {
        id:    users.id,
        name:  users.name,
        email: users.email,
      },
      createdBy: {
        id:    users.id,
        name:  users.name,
        email: users.email,
      },
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.assignedToId, users.id))
    .where(eq(tickets.customerId, customerId));
}

/** Count tickets linked to a customer (used before delete). */
export async function countCustomerTickets(customerId) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(tickets)
    .where(eq(tickets.customerId, customerId));

  return Number(n);
}

// ── Application assignment ────────────────────────────────────────────────────

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

/** Delete all application assignments for a customer (used before delete). */
export async function deleteCustomerAssignments(customerId) {
  await db.delete(customerApplications).where(eq(customerApplications.customerId, customerId));
}

/** Verify an application exists and belongs to the tenant. */
export async function findApplicationInTenant(applicationId, tenantId) {
  const rows = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.tenantId, tenantId)))
    .limit(1);

  return rows[0] ?? null;
}
