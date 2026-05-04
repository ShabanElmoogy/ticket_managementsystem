import * as repo from './customerVisits.repository.js';
import * as customersRepo from '../customers.repository.js';
import { fail } from '../../../utils/controllerHelpers.js';

// ── Read ──────────────────────────────────────────────────────────────────────

export async function listVisits(customerId, tenantId) {
  const customer = await customersRepo.findCustomerById(customerId, tenantId);
  if (!customer) throw fail('Customer not found', 404);
  return repo.findVisitsByCustomer(customerId);
}

export async function getVisitById(visitId, customerId, tenantId) {
  const customer = await customersRepo.findCustomerById(customerId, tenantId);
  if (!customer) throw fail('Customer not found', 404);

  const visit = await repo.findVisitById(visitId);
  if (!visit || visit.customerId !== customerId) throw fail('Visit not found', 404);
  return visit;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createVisit(customerId, tenantId, userId, body) {
  const customer = await customersRepo.findCustomerById(customerId, tenantId);
  if (!customer) throw fail('Customer not found', 404);

  const { status = 'COMPLETED', visitedAt, notes, latitude, longitude } = body;

  const visit = await repo.insertVisit({
    customerId,
    userId,
    status,
    visitedAt:  visitedAt ? new Date(visitedAt) : new Date(),
    notes:      notes ?? null,
    latitude:   latitude  ?? null,
    longitude:  longitude ?? null,
  });

  // Return with user info
  return repo.findVisitById(visit.id);
}

export async function updateVisit(visitId, customerId, tenantId, userId, body) {
  const customer = await customersRepo.findCustomerById(customerId, tenantId);
  if (!customer) throw fail('Customer not found', 404);

  const existing = await repo.findVisitById(visitId);
  if (!existing || existing.customerId !== customerId) throw fail('Visit not found', 404);

  // Only the visit creator or an admin can update
  // (role check is done in the controller via middleware)

  const data = {};
  if (body.status    !== undefined) data.status    = body.status;
  if (body.visitedAt !== undefined) data.visitedAt = new Date(body.visitedAt);
  if (body.notes     !== undefined) data.notes     = body.notes ?? null;
  if (body.latitude  !== undefined) data.latitude  = body.latitude  ?? null;
  if (body.longitude !== undefined) data.longitude = body.longitude ?? null;

  await repo.updateVisitById(visitId, data);
  return repo.findVisitById(visitId);
}

export async function deleteVisit(visitId, customerId, tenantId) {
  const customer = await customersRepo.findCustomerById(customerId, tenantId);
  if (!customer) throw fail('Customer not found', 404);

  const existing = await repo.findVisitById(visitId);
  if (!existing || existing.customerId !== customerId) throw fail('Visit not found', 404);

  await repo.deleteVisitById(visitId);
  return { message: 'Visit deleted successfully' };
}
