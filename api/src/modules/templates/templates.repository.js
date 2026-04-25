/**
 * templates.repository.js
 * All database queries for the templates module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { ticketTemplates } from './templates.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, or, isNull, count, sql } from 'drizzle-orm';

// ── Shared column selection ───────────────────────────────────────────────────

const TEMPLATE_SELECT = {
  id:             ticketTemplates.id,
  name:           ticketTemplates.name,
  description:    ticketTemplates.description,
  priority:       ticketTemplates.priority,
  estimatedHours: ticketTemplates.estimatedHours,
  tenantId:       ticketTemplates.tenantId,
  createdAt:      ticketTemplates.createdAt,
  createdBy:      { id: users.id, name: users.name },
};

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * List templates visible to the caller.
 * Tenant users see global templates (tenantId IS NULL) + their own.
 * Super-admin sees only global templates (no tenantId).
 */
export async function findAllTemplates(tenantId, options = {}) {
  const { limit, offset, search } = options;
  
  let query = db
    .select(TEMPLATE_SELECT)
    .from(ticketTemplates)
    .innerJoin(users, eq(ticketTemplates.createdById, users.id));

  // Base visibility filter
  const visibilityFilter = tenantId
    ? or(eq(ticketTemplates.tenantId, tenantId), isNull(ticketTemplates.tenantId))
    : isNull(ticketTemplates.tenantId);

  // Add search functionality
  if (search) {
    query = query.where(
      and(
        visibilityFilter,
        or(
          sql`${ticketTemplates.name} ILIKE ${`%${search}%`}`,
          sql`${ticketTemplates.description} ILIKE ${`%${search}%`}`
        )
      )
    );
  } else {
    query = query.where(visibilityFilter);
  }

  query = query.orderBy(ticketTemplates.name);

  // Add pagination if requested
  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.offset(offset);
  }

  return query;
}

/**
 * Count templates visible to the caller for pagination.
 */
export async function countAllTemplates(tenantId, options = {}) {
  const { search } = options;
  
  let query = db
    .select({ count: count() })
    .from(ticketTemplates)
    .innerJoin(users, eq(ticketTemplates.createdById, users.id));

  // Base visibility filter
  const visibilityFilter = tenantId
    ? or(eq(ticketTemplates.tenantId, tenantId), isNull(ticketTemplates.tenantId))
    : isNull(ticketTemplates.tenantId);

  // Add search functionality
  if (search) {
    query = query.where(
      and(
        visibilityFilter,
        or(
          sql`${ticketTemplates.name} ILIKE ${`%${search}%`}`,
          sql`${ticketTemplates.description} ILIKE ${`%${search}%`}`
        )
      )
    );
  } else {
    query = query.where(visibilityFilter);
  }

  const [{ count: total }] = await query;
  return Number(total);
}

/** Insert a new template, returns the created row. */
export async function insertTemplate(values) {
  const [row] = await db.insert(ticketTemplates).values(values).returning();
  return row;
}

/** Update a template by ID (optionally tenant-scoped), returns the updated row. */
export async function updateTemplateById(id, tenantId, data) {
  const where = tenantId
    ? and(eq(ticketTemplates.id, id), eq(ticketTemplates.tenantId, tenantId))
    : eq(ticketTemplates.id, id);

  const [row] = await db
    .update(ticketTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(where)
    .returning();

  return row ?? null;
}

/** Delete a template by ID (optionally tenant-scoped), returns { id } or null. */
export async function deleteTemplateById(id, tenantId) {
  const where = tenantId
    ? and(eq(ticketTemplates.id, id), eq(ticketTemplates.tenantId, tenantId))
    : eq(ticketTemplates.id, id);

  const [deleted] = await db
    .delete(ticketTemplates)
    .where(where)
    .returning({ id: ticketTemplates.id });

  return deleted ?? null;
}
