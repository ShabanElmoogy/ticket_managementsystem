/**
 * labels.service.js
 * Business logic for the labels module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './labels.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Unique constraint detection ───────────────────────────────────────────────

function isUniqueViolation(err) {
  return err.code === '23505' || err.message?.includes('UNIQUE constraint failed');
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listLabels() {
  return repo.findAllLabels();
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
