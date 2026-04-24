/**
 * templates.repository.js
 * All database queries for the templates module.
 * No business logic — only data access.
 */

import { db } from '../../config/database.js';
import { ticketTemplates } from './templates.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, or, isNull } from 'drizzle-orm';

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
export async function findAllTemplates(tenantId) {
  return db
    .select(TEMPLATE_SELECT)
    .from(ticketTemplates)
    .innerJoin(users, eq(ticketTemplates.createdById, users.id))
    .where(
      tenantId
        ? or(eq(ticketTemplates.tenantId, tenantId), isNull(ticketTemplates.tenantId))
        : isNull(ticketTemplates.tenantId),
    )
    .orderBy(ticketTemplates.name);
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
