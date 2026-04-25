/**
 * templates.service.js
 * Business logic for the templates module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './templates.repository.js';
import { parsePaginationParams, buildPaginatedResponse, parseSearchParam } from '../../utils/pagination.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * List templates with optional pagination and search.
 * @param {string|null} tenantId - Tenant ID for scoping
 * @param {Object} query - Query parameters from request
 * @returns {Array|Object} Array of templates or paginated response
 */
export async function listTemplates(tenantId, query = {}) {
  // Parse and validate search parameter
  const search = parseSearchParam(query);
  
  // Determine if pagination is requested
  const hasPagination = 'page' in query || 'limit' in query;
  
  if (!hasPagination) {
    // Legacy behavior - return all templates as array
    return repo.findAllTemplates(tenantId ?? null, { search });
  }

  // Paginated response with validation
  const { page, limit, offset } = parsePaginationParams(query);
  
  // Additional validation for pagination parameters
  if (page < 1) {
    throw fail('Page must be >= 1', 400);
  }
  if (limit < 1 || limit > 100) {
    throw fail('Limit must be between 1 and 100', 400);
  }

  // Execute count and data queries in parallel for optimal performance
  const [data, total] = await Promise.all([
    repo.findAllTemplates(tenantId ?? null, { limit, offset, search }),
    repo.countAllTemplates(tenantId ?? null, { search }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
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
