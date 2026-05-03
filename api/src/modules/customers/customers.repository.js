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
import { eq, and, desc, count, inArray, sql } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

const CUSTOMER_COLUMNS = {
  id:                    customers.id,
  tenantId:              customers.tenantId,
  name:                  customers.name,
  email:                 customers.email,
  phone:                 customers.phone,
  company:               customers.company,
  address:               customers.address,
  latitude:              customers.latitude,
  longitude:             customers.longitude,
  maintenanceType:       customers.maintenanceType,
  subscriptionStartDate: customers.subscriptionStartDate,
  subscriptionEndDate:   customers.subscriptionEndDate,
  createdAt:             customers.createdAt,
  updatedAt:             customers.updatedAt,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * List all customers, optionally scoped to a tenant.
 * Supports pagination and search with comprehensive validation.
 * @param {string|null} tenantId - Tenant ID for scoping
 * @param {Object} options - Query options { limit?, offset?, search? }
 * @returns {Promise<Array>} Array of customers
 */
export async function findAllCustomers(tenantId, options = {}) {
  // Input validation - ensure positive numbers
  const { limit, offset, search } = options;
  
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error('Limit must be a positive integer');
  }
  
  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    throw new Error('Offset must be a non-negative integer');
  }

  // Build base query with proper column selection
  let query = db
    .select(CUSTOMER_COLUMNS)
    .from(customers);

  // Add tenant scoping and search conditions
  let whereConditions = [];
  if (tenantId) {
    whereConditions.push(eq(customers.tenantId, tenantId));
  }

  // Add search functionality with ILIKE for case-insensitive search
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const searchTerm = search.trim();
    const searchCondition = sql`${customers.name} ILIKE ${`%${searchTerm}%`} OR ${customers.email} ILIKE ${`%${searchTerm}%`} OR ${customers.company} ILIKE ${`%${searchTerm}%`}`;
    whereConditions.push(searchCondition);
  }

  // Apply all where conditions
  if (whereConditions.length > 0) {
    query = query.where(
      whereConditions.length === 1 
        ? whereConditions[0] 
        : and(...whereConditions)
    );
  }

  // Add consistent ordering for predictable pagination
  query = query.orderBy(desc(customers.createdAt));

  // Add pagination - only when explicitly requested
  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.offset(offset);
  }

  return query;
}

/**
 * Count all customers, optionally scoped to a tenant.
 * Supports search filtering with same conditions as findAllCustomers.
 * @param {string|null} tenantId - Tenant ID for scoping
 * @param {Object} options - Query options { search? }
 * @returns {Promise<number>} Total count
 */
export async function countAllCustomers(tenantId, options = {}) {
  const { search } = options;
  
  let query = db
    .select({ count: count() })
    .from(customers);

  // Apply same filters as main query for consistency
  let whereConditions = [];
  if (tenantId) {
    whereConditions.push(eq(customers.tenantId, tenantId));
  }

  // Add search functionality with same logic as findAllCustomers
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const searchTerm = search.trim();
    const searchCondition = sql`${customers.name} ILIKE ${`%${searchTerm}%`} OR ${customers.email} ILIKE ${`%${searchTerm}%`} OR ${customers.company} ILIKE ${`%${searchTerm}%`}`;
    whereConditions.push(searchCondition);
  }

  // Apply all where conditions
  if (whereConditions.length > 0) {
    query = query.where(
      whereConditions.length === 1 
        ? whereConditions[0] 
        : and(...whereConditions)
    );
  }

  const result = await query;
  return Number(result[0]?.count ?? 0);
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
