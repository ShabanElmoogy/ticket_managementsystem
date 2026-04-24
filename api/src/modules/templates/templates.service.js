/**
 * templates.service.js
 * Business logic for the templates module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './templates.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listTemplates(tenantId) {
  return repo.findAllTemplates(tenantId ?? null);
}

export async function createTemplate(tenantId, body, createdById) {
  const { name, description, priority = 'MEDIUM', estimatedHours } = body;
  if (!name?.trim()) throw fail('name is required');

  return repo.insertTemplate({
    tenantId:       tenantId ?? null,
    name:           name.trim(),
    description:    description?.trim() || null,
    priority,
    estimatedHours: estimatedHours ?? null,
    createdById,
  });
}

export async function updateTemplate(id, tenantId, body) {
  const { name, description, priority, estimatedHours } = body;

  const data = {};
  if (name           !== undefined) data.name           = name.trim();
  if (description    !== undefined) data.description    = description?.trim() || null;
  if (priority       !== undefined) data.priority       = priority;
  if (estimatedHours !== undefined) data.estimatedHours = estimatedHours ?? null;

  const updated = await repo.updateTemplateById(id, tenantId ?? null, data);
  if (!updated) throw fail('Template not found', 404);
  return updated;
}

export async function deleteTemplate(id, tenantId) {
  const deleted = await repo.deleteTemplateById(id, tenantId ?? null);
  if (!deleted) throw fail('Template not found', 404);
  return { message: 'Template deleted' };
}
