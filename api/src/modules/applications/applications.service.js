/**
 * applications.service.js
 * Business logic for the applications module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './applications.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Read operations ───────────────────────────────────────────────────────────

export async function listApplications(tenantId) {
  return repo.findAllApplications(tenantId ?? null);
}

export async function getApplicationById(id, tenantId) {
  const app = await repo.findApplicationById(id, tenantId ?? null);
  if (!app) throw fail('Application not found', 404);

  const [appCustomers, appTickets] = await Promise.all([
    repo.findApplicationCustomers(id, tenantId ?? null),
    repo.findApplicationTickets(id, tenantId ?? null),
  ]);

  return { ...app, customers: appCustomers, tickets: appTickets };
}

// ── Write operations ──────────────────────────────────────────────────────────

export async function createApplication(tenantId, { name, description, version }) {
  const duplicate = await repo.findApplicationByName(name, tenantId);
  if (duplicate) throw fail('Application with this name already exists');

  return repo.insertApplication({ tenantId, name, description, version });
}

export async function updateApplication(id, tenantId, { name, description, version }) {
  const existing = await repo.findApplicationById(id, tenantId ?? null);
  if (!existing) throw fail('Application not found', 404);

  // Duplicate name check — only when name is changing
  if (name && name !== existing.name) {
    const taken = await repo.findApplicationByName(name, tenantId ?? null);
    if (taken) throw fail('Application with this name already exists');
  }

  const data = {};
  if (name        !== undefined) data.name        = name;
  if (description !== undefined) data.description = description;
  if (version     !== undefined) data.version     = version;

  return repo.updateApplicationById(id, tenantId ?? null, data);
}

export async function deleteApplication(id, tenantId, force = false) {
  const existing = await repo.findApplicationById(id, tenantId ?? null);
  if (!existing) throw fail('Application not found', 404);

  const ticketCount = await repo.countApplicationTickets(id, tenantId ?? null);

  if (!force && ticketCount > 0) {
    throw fail(
      'Cannot delete application with existing tickets. Use ?force=true to cascade delete all linked tickets.',
    );
  }

  if (force && ticketCount > 0) {
    await repo.forceDeleteApplication(id, tenantId ?? null);
    return { message: 'Application and all linked tickets deleted successfully' };
  }

  await repo.deleteApplicationById(id, tenantId ?? null);
  return { message: 'Application deleted successfully' };
}

// ── Customer assignment ───────────────────────────────────────────────────────

export async function assignCustomer(tenantId, applicationId, customerId) {
  const [app, customer] = await Promise.all([
    repo.findApplicationById(applicationId, tenantId),
    repo.findCustomerInTenant(customerId, tenantId),
  ]);

  if (!app)      throw fail('Application not found', 404);
  if (!customer) throw fail('Customer not found', 404);

  const existing = await repo.findAssignment(customerId, applicationId);
  if (existing) throw fail('Customer is already assigned to this application');

  return repo.insertAssignment(customerId, applicationId);
}

export async function removeCustomer(tenantId, applicationId, customerId) {
  const [app, customer] = await Promise.all([
    repo.findApplicationById(applicationId, tenantId),
    repo.findCustomerInTenant(customerId, tenantId),
  ]);

  if (!app)      throw fail('Application not found', 404);
  if (!customer) throw fail('Customer not found', 404);

  const deleted = await repo.deleteAssignment(customerId, applicationId);
  if (!deleted) throw fail('Assignment not found', 404);

  return { message: 'Customer removed from application successfully' };
}
