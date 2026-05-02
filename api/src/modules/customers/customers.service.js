/**
 * customers.service.js
 * Business logic for the customers module.
 * Orchestrates repository calls, enforces rules, throws descriptive errors.
 */

import * as repo from './customers.repository.js';
import { parsePaginationParams, buildPaginatedResponse, parseSearchParam } from '../../utils/pagination.js';

// ── Error helper ──────────────────────────────────────────────────────────────

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Subscription status helpers ───────────────────────────────────────────────

export function getCustomerStatus(customer) {
  const now = new Date();
  const { maintenanceType, subscriptionStartDate, subscriptionEndDate } = customer;

  if (!maintenanceType) return 'INACTIVE';
  if (maintenanceType === 'PAY_AS_YOU_GO') return 'PAY_AS_YOU_GO';

  if (maintenanceType === 'FREE_TRIAL') {
    if (!subscriptionStartDate || !subscriptionEndDate) return 'INACTIVE';
    return now >= new Date(subscriptionStartDate) && now <= new Date(subscriptionEndDate)
      ? 'TRIAL'
      : 'EXPIRED';
  }

  if (maintenanceType === 'MONTHLY_SUBSCRIPTION') {
    if (!subscriptionStartDate || !subscriptionEndDate) return 'INACTIVE';
    return now >= new Date(subscriptionStartDate) && now <= new Date(subscriptionEndDate)
      ? 'ACTIVE'
      : 'EXPIRED';
  }

  return 'INACTIVE';
}

export function isCustomerActive(customer) {
  const status = getCustomerStatus(customer);
  return status === 'ACTIVE' || status === 'TRIAL';
}

function withSubscription(customer) {
  return {
    ...customer,
    subscriptionStatus: getCustomerStatus(customer),
    isActive:           isCustomerActive(customer),
  };
}

// ── Read operations ───────────────────────────────────────────────────────────

/**
 * List customers with optional pagination and search.
 * Maintains backward compatibility while adding comprehensive validation.
 * @param {string|null} tenantId - Tenant ID for scoping
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Array|Object>} Array of customers or paginated response
 */
export async function listCustomers(tenantId, query = {}) {
  // Input validation
  if (tenantId && typeof tenantId !== 'string') {
    throw fail('Invalid tenant ID', 400);
  }

  // Parse and validate search parameter
  const search = parseSearchParam(query);
  
  // Determine if pagination is requested
  const hasPagination = 'page' in query || 'limit' in query;
  
  if (!hasPagination) {
    // Legacy behavior - return all customers as array
    const list = await repo.findAllCustomers(tenantId, { search });
    if (!list.length) return [];

    // Enrich with related data using batch query (avoid N+1)
    const ids = list.map((c) => c.id);
    const details = await repo.getBatchCustomerDetails(ids);

    return list.map((c) => ({
      ...withSubscription(c),
      applications: details[c.id]?.applications ?? [],
      _count: { tickets: details[c.id]?.ticketCount ?? 0 },
    }));
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
  const [list, total] = await Promise.all([
    repo.findAllCustomers(tenantId, { limit, offset, search }),
    repo.countAllCustomers(tenantId, { search }),
  ]);

  if (!list.length) {
    return buildPaginatedResponse([], total, page, limit);
  }

  // Enrich with related data using efficient batch query
  const ids = list.map((c) => c.id);
  const details = await repo.getBatchCustomerDetails(ids);

  const enrichedData = list.map((c) => ({
    ...withSubscription(c),
    applications: details[c.id]?.applications ?? [],
    _count: { tickets: details[c.id]?.ticketCount ?? 0 },
  }));

  // Return structured paginated response
  return buildPaginatedResponse(enrichedData, total, page, limit);
}

export async function getCustomerById(id, tenantId) {
  return detailAsync({
    finderFn:   repo.findCustomerById,
    entityName: 'Customer',
    id,
    finderArgs: [tenantId ?? null],
    transform:  withSubscription,
    relations: [
      { key: 'applications', fn: repo.findCustomerApplications },
      { key: 'tickets',      fn: repo.findCustomerTickets      },
    ],
  });
}

// ── Write operations ──────────────────────────────────────────────────────────

export async function createCustomer(tenantId, body) {
  const {
    name, email, phone, address, company,
    applicationIds = [],
    maintenanceType,
    subscriptionStartDate,
    subscriptionEndDate,
  } = body;

  const duplicate = await repo.findCustomerByEmail(email, tenantId);
  if (duplicate) throw fail('Customer with this email already exists');

  const customer = await repo.insertCustomer({
    tenantId,
    name,
    email,
    phone:                 phone ?? null,
    address:               address ?? null,
    company:               company ?? null,
    maintenanceType:       maintenanceType ?? null,
    subscriptionStartDate: subscriptionStartDate ? new Date(subscriptionStartDate) : null,
    subscriptionEndDate:   subscriptionEndDate   ? new Date(subscriptionEndDate)   : null,
  });

  if (applicationIds.length > 0) {
    await Promise.all(
      applicationIds.map((appId) => repo.insertAssignment(customer.id, appId)),
    );
  }

  const customerApps = await repo.findCustomerApplications(customer.id);

  return { ...withSubscription(customer), applications: customerApps };
}

export async function updateCustomer(id, tenantId, body) {
  const {
    name, email, phone, address, company,
    applicationIds,
    maintenanceType,
    subscriptionStartDate,
    subscriptionEndDate,
  } = body;

  const existing = await repo.findCustomerById(id, tenantId);
  if (!existing) throw fail('Customer not found', 404);

  // Email uniqueness check — only when email is actually changing
  if (email && email !== existing.email) {
    const taken = await repo.findCustomerByEmail(email, tenantId);
    if (taken) throw fail('Customer with this email already exists');
  }

  // Build partial update — only include fields that were sent
  const data = {};
  if (name                !== undefined) data.name                = name;
  if (email               !== undefined) data.email               = email;
  if (phone               !== undefined) data.phone               = phone ?? null;
  if (address             !== undefined) data.address             = address ?? null;
  if (company             !== undefined) data.company             = company ?? null;
  if (maintenanceType     !== undefined) data.maintenanceType     = maintenanceType ?? null;
  if (subscriptionStartDate !== undefined)
    data.subscriptionStartDate = subscriptionStartDate ? new Date(subscriptionStartDate) : null;
  if (subscriptionEndDate !== undefined)
    data.subscriptionEndDate   = subscriptionEndDate   ? new Date(subscriptionEndDate)   : null;

  const customer = await repo.updateCustomerById(id, tenantId, data);

  // Replace application assignments when applicationIds is explicitly provided
  if (applicationIds !== undefined) {
    await repo.deleteCustomerAssignments(id);
    if (applicationIds.length > 0) {
      await Promise.all(
        applicationIds.map((appId) => repo.insertAssignment(id, appId)),
      );
    }
  }

  const customerApps = await repo.findCustomerApplications(id);

  return { ...withSubscription(customer), applications: customerApps };
}

export async function deleteCustomer(id, tenantId) {
  const existing = await repo.findCustomerById(id, tenantId);
  if (!existing) throw fail('Customer not found', 404);

  const ticketCount = await repo.countCustomerTickets(id);
  if (ticketCount > 0) {
    throw fail(
      'Cannot delete customer with existing tickets. Please reassign or delete tickets first.',
    );
  }

  await repo.deleteCustomerAssignments(id);
  await repo.deleteCustomerById(id, tenantId);

  return { message: 'Customer deleted successfully' };
}

// ── Application assignment ────────────────────────────────────────────────────

export async function assignApplication(tenantId, customerId, applicationId) {
  const [customer, application] = await Promise.all([
    repo.findCustomerById(customerId, tenantId),
    repo.findApplicationInTenant(applicationId, tenantId),
  ]);

  if (!customer)     throw fail('Customer not found', 404);
  if (!application)  throw fail('Application not found', 404);

  const existing = await repo.findAssignment(customerId, applicationId);
  if (existing) throw fail('Customer is already assigned to this application');

  return repo.insertAssignment(customerId, applicationId);
}

export async function removeApplication(tenantId, customerId, applicationId) {
  const customer = await repo.findCustomerById(customerId, tenantId);
  if (!customer) throw fail('Customer not found', 404);

  const deleted = await repo.deleteAssignment(customerId, applicationId);
  if (!deleted) throw fail('Assignment not found', 404);

  return { message: 'Application removed from customer successfully' };
}
