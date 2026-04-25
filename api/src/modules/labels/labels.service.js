/**
 * labels.service.js
 * Business logic for the labels module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './labels.repository.js';
import { parsePaginationParams, buildPaginatedResponse, parseSearchParam } from '../../utils/pagination.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Unique constraint detection ───────────────────────────────────────────────

function isUniqueViolation(err) {
  return err.code === '23505' || err.message?.includes('UNIQUE constraint failed');
}

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * List labels with optional pagination and search.
 * @param {Object} query - Query parameters from request
 * @returns {Array|Object} Array of labels or paginated response
 */
export async function listLabels(query = {}) {
  // Parse and validate search parameter
  const search = parseSearchParam(query);
  
  // Determine if pagination is requested
  const hasPagination = 'page' in query || 'limit' in query;
  
  if (!hasPagination) {
    // Legacy behavior - return all labels as array
    return repo.findAllLabels({ search });
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
    repo.findAllLabels({ limit, offset, search }),
    repo.countAllLabels({ search }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
}

export async function createLabel(body) {
  const { name, color, description } = body;
  try {
    return await repo.insertLabel({ name, color, description });
  } catch (err) {
    if (isUniqueViolation(err)) throw fail('Label name already exists');
    throw err;
  }
}

export async function updateLabel(id, body) {
  const { name, color, description } = body;
  const data = {};
  if (name        !== undefined) data.name        = name;
  if (color       !== undefined) data.color       = color;
  if (description !== undefined) data.description = description;

  try {
    const updated = await repo.updateLabelById(id, data);
    if (!updated) throw fail('Label not found', 404);
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) throw fail('Label name already exists');
    throw err;
  }
}

export async function deleteLabel(id) {
  await repo.deleteLabelById(id);
  return { message: 'Label deleted successfully' };
}

export async function addLabelToTicket(ticketId, labelId) {
  try {
    const assignment = await repo.insertTicketLabel(ticketId, labelId);
    const result = await repo.findTicketLabelWithLabel(assignment.id);
    return result;
  } catch (err) {
    if (isUniqueViolation(err)) throw fail('Label already assigned to ticket');
    throw err;
  }
}

export async function removeLabelFromTicket(ticketId, labelId) {
  await repo.deleteTicketLabel(ticketId, labelId);
  return { message: 'Label removed from ticket successfully' };
}
