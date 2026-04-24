/**
 * tenants.repository.js
 * All database queries for the tenants module.
 * No business logic — only data access.
 */

import { eq, and, count, inArray } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { tenants } from './tenants.schema.js';
import { users } from '../users/users.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { Role } from '../../constants/roles.js';

// ── Tenant queries ────────────────────────────────────────────────────────────

/** List all tenants ordered by creation date. */
export async function findAllTenants() {
  return db.select().from(tenants).orderBy(tenants.createdAt);
}

/** List minimal tenant fields for the public login dropdown. */
export async function findAllTenantsPublic() {
  return db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .orderBy(tenants.name);
}

/** Find a tenant by ID. */
export async function findTenantById(id) {
  const rows = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Find a tenant by slug. */
export async function findTenantBySlug(slug) {
  const rows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/** Find a tenant by slug (existence check — id only). */
export async function findTenantBySlugMeta(slug) {
  const rows = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/** Insert a new tenant, returns the created row. */
export async function insertTenant(values) {
  const [row] = await db.insert(tenants).values(values).returning();
  return row;
}

/** Update a tenant by ID, returns the updated row. */
export async function updateTenantById(id, data) {
  const [row] = await db
    .update(tenants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tenants.id, id))
    .returning();
  return row ?? null;
}

/** Soft-delete a tenant by suspending it. */
export async function suspendTenantById(id) {
  const [row] = await db
    .update(tenants)
    .set({ subscriptionStatus: 'SUSPENDED', updatedAt: new Date() })
    .where(eq(tenants.id, id))
    .returning();
  return row ?? null;
}

// ── Batch counts (no N+1) ─────────────────────────────────────────────────────

/**
 * Get the first user of each role for a set of tenant IDs.
 * Returns a map: { [tenantId]: { adminEmail, employeeEmail, programmerEmail } }
 */
export async function getBatchTenantRepresentatives(tenantIds) {
  if (!tenantIds.length) return {};

  const rows = await db
    .select({ tenantId: users.tenantId, email: users.email, role: users.role })
    .from(users)
    .where(
      and(
        inArray(users.tenantId, tenantIds),
        inArray(users.role, [Role.TENANT_ADMIN, Role.EMPLOYEE, Role.PROGRAMMER]),
      ),
    );

  const result = {};
  for (const id of tenantIds) {
    const tenantRows = rows.filter((r) => r.tenantId === id);
    result[id] = {
      adminEmail:      tenantRows.find((r) => r.role === Role.TENANT_ADMIN)?.email ?? null,
      employeeEmail:   tenantRows.find((r) => r.role === Role.EMPLOYEE)?.email     ?? null,
      programmerEmail: tenantRows.find((r) => r.role === Role.PROGRAMMER)?.email   ?? null,
    };
  }
  return result;
}

/**
 * Count users and active tickets for a tenant.
 * Tickets are scoped via createdBy user's tenantId (tickets have no tenantId column).
 */
export async function getTenantCounts(tenantId) {
  const [userRow] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.tenantId, tenantId));

  // Get user IDs in this tenant, then count their tickets
  const tenantUserIds = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.tenantId, tenantId));

  const ids = tenantUserIds.map((u) => u.id);

  const [ticketRow] = ids.length
    ? await db
        .select({ count: count() })
        .from(tickets)
        .where(and(inArray(tickets.createdById, ids), eq(tickets.deletedAt, null)))
    : [{ count: 0 }];

  return {
    userCount:   Number(userRow.count),
    ticketCount: Number(ticketRow.count),
  };
}
