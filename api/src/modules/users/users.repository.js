/**
 * users.repository.js
 * All database queries for the users module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { users } from './users.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { tickets, ticketActivities } from '../tickets/tickets.schema.js';
import { comments } from '../comments/comments.schema.js';
import { eq, count, desc, inArray, or, and } from 'drizzle-orm';
import { Role } from '../../constants/roles.js';

// ── Shared column selection ───────────────────────────────────────────────────

/** Columns returned for every user response (no password). */
const USER_COLUMNS = {
  id:                   users.id,
  email:                users.email,
  name:                 users.name,
  role:                 users.role,
  phone:                users.phone,
  whatsappNotifications: users.whatsappNotifications,
  reminderEnabled:      users.reminderEnabled,
  reminderInterval:     users.reminderInterval,
  createdAt:            users.createdAt,
  updatedAt:            users.updatedAt,
};

/** Columns returned when a tenant join is needed (super-admin list). */
const USER_COLUMNS_WITH_TENANT = {
  ...USER_COLUMNS,
  tenantId:   users.tenantId,
  tenantName: tenants.name,
};

// ── Count helpers ─────────────────────────────────────────────────────────────

/**
 * Returns { assignedTickets, createdTickets, comments } counts for a single user.
 */
export async function getUserCounts(userId) {
  const [[assigned], [created], [commented]] = await Promise.all([
    db.select({ count: count() }).from(tickets).where(eq(tickets.assignedToId, userId)),
    db.select({ count: count() }).from(tickets).where(eq(tickets.createdById,  userId)),
    db.select({ count: count() }).from(comments).where(eq(comments.userId,     userId)),
  ]);
  return {
    assignedTickets: Number(assigned.count),
    createdTickets:  Number(created.count),
    comments:        Number(commented.count),
  };
}

/**
 * Returns a map of userId → counts for a batch of user IDs.
 * Used by list endpoints to avoid N+1 queries.
 */
export async function getBatchUserCounts(userIds) {
  if (!userIds.length) return {};

  const [assignedRows, createdRows, commentRows] = await Promise.all([
    db.select({ userId: tickets.assignedToId, count: count() })
      .from(tickets).where(inArray(tickets.assignedToId, userIds)).groupBy(tickets.assignedToId),
    db.select({ userId: tickets.createdById, count: count() })
      .from(tickets).where(inArray(tickets.createdById, userIds)).groupBy(tickets.createdById),
    db.select({ userId: comments.userId, count: count() })
      .from(comments).where(inArray(comments.userId, userIds)).groupBy(comments.userId),
  ]);

  const result = {};
  for (const id of userIds) {
    result[id] = {
      assignedTickets: Number(assignedRows.find((r) => r.userId === id)?.count ?? 0),
      createdTickets:  Number(createdRows.find((r)  => r.userId === id)?.count ?? 0),
      comments:        Number(commentRows.find((r)  => r.userId === id)?.count ?? 0),
    };
  }
  return result;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** List all TENANT_ADMIN users with tenant name (super-admin). */
export async function findAllUsers() {
  return db
    .select(USER_COLUMNS_WITH_TENANT)
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.role, Role.TENANT_ADMIN))
    .orderBy(desc(users.createdAt));
}

/** Find a single user by ID (no password). */
export async function findUserById(id) {
  const rows = await db
    .select(USER_COLUMNS)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a user by ID scoped to a tenant. */
export async function findTenantUserById(id, tenantId) {
  const rows = await db
    .select({ ...USER_COLUMNS, tenantId: users.tenantId })
    .from(users)
    .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a user by email (global). */
export async function findUserByEmail(email) {
  const rows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a user by email scoped to a tenant. */
export async function findUserByEmailInTenant(email, tenantId) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

/** List all users in a tenant. */
export async function findUsersByTenant(tenantId) {
  return db
    .select(USER_COLUMNS)
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(desc(users.createdAt));
}

/** Count users in a tenant. */
export async function countUsersInTenant(tenantId) {
  const [{ count: n }] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.tenantId, tenantId));
  return Number(n);
}

/** Get tenant subscription seats. */
export async function findTenantSeats(tenantId) {
  const [tenant] = await db
    .select({ subscriptionSeats: tenants.subscriptionSeats })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return tenant?.subscriptionSeats ?? 0;
}

/** Insert a new user, returns the created row (no password). */
export async function insertUser(values) {
  const [user] = await db
    .insert(users)
    .values(values)
    .returning(USER_COLUMNS);
  return user;
}

/** Update a user by ID, returns the updated row (no password). */
export async function updateUserById(id, data) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(USER_COLUMNS);
  return user;
}

/** Update a user by ID scoped to a tenant, returns the updated row. */
export async function updateTenantUserById(id, tenantId, data) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
    .returning(USER_COLUMNS);
  return user;
}

/** Update only the password for a user. */
export async function updateUserPassword(id, hashedPassword) {
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, id));
}

/** Delete a user by ID. */
export async function deleteUserById(id) {
  await db.delete(users).where(eq(users.id, id));
}

/** Delete a user by ID scoped to a tenant. */
export async function deleteTenantUserById(id, tenantId) {
  await db.delete(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
}

/** Force-delete a user and all related data in a transaction. */
export async function forceDeleteUser(id) {
  await db.transaction(async (tx) => {
    // 1. Delete ticket activities that reference this user
    await tx.delete(ticketActivities).where(eq(ticketActivities.userId, id));

    // 2. Delete comments by this user
    await tx.delete(comments).where(eq(comments.userId, id));

    // 3. Unassign tickets assigned to this user (keep the tickets, just clear assignee)
    await tx.update(tickets).set({ assignedToId: null }).where(eq(tickets.assignedToId, id));

    // 4. For tickets created by this user: delete their children first, then the tickets
    const createdTickets = await tx
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.createdById, id));

    if (createdTickets.length > 0) {
      const ticketIds = createdTickets.map((t) => t.id);
      // Delete comments on those tickets
      await tx.delete(comments).where(inArray(comments.ticketId, ticketIds));
      // Delete activities on those tickets
      await tx.delete(ticketActivities).where(inArray(ticketActivities.ticketId, ticketIds));
      // Now safe to delete the tickets
      await tx.delete(tickets).where(inArray(tickets.id, ticketIds));
    }

    // 5. Finally delete the user
    await tx.delete(users).where(eq(users.id, id));
  });
}

/** Get user role counts and active user count. */
export async function getUserStats() {
  const [roleRows, [totalRow], activeRows] = await Promise.all([
    db.select({ role: users.role, count: count() }).from(users).groupBy(users.role),
    db.select({ count: count() }).from(users),
    db.select({ userId: tickets.assignedToId })
      .from(tickets)
      .where(or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS')))
      .groupBy(tickets.assignedToId),
  ]);
  return {
    total:  Number(totalRow.count),
    active: activeRows.length,
    byRole: roleRows.reduce((acc, r) => { acc[r.role] = Number(r.count); return acc; }, {}),
  };
}

/** Get employees — tenant-scoped or global. */
export async function findEmployees(tenantId) {
  const where = tenantId
    ? and(eq(users.role, Role.EMPLOYEE), eq(users.tenantId, tenantId))
    : eq(users.role, Role.EMPLOYEE);
  return db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(where);
}

/** Get programmers — tenant-scoped or global. */
export async function findProgrammers(tenantId) {
  const where = tenantId
    ? and(eq(users.role, Role.PROGRAMMER), eq(users.tenantId, tenantId))
    : eq(users.role, Role.PROGRAMMER);
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(where);
}

/** Get tenant suspension status. */
export async function findTenantStatus(userId) {
  const [user] = await db
    .select({ tenantId: users.tenantId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.tenantId) return { suspended: false };

  const [tenant] = await db
    .select({ subscriptionStatus: tenants.subscriptionStatus, subscriptionEnd: tenants.subscriptionEnd })
    .from(tenants)
    .where(eq(tenants.id, user.tenantId))
    .limit(1);

  if (!tenant) return { suspended: false };

  const expired   = tenant.subscriptionEnd && new Date(tenant.subscriptionEnd) < new Date();
  const suspended = tenant.subscriptionStatus === 'CANCELED' || !!expired;
  return { suspended };
}
