/**
 * ticketArbitraries.ts — Shared fast-check arbitraries for ticket domain types.
 *
 * Used across all property-based tests in this feature.
 */

import * as fc from 'fast-check';

// ─────────────────────────────────────────────────────────────────────────────
// Domain constants
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'PROGRAMMING',
  'UNDER_DEVELOPMENT',
  'CODE_REVIEW',
  'TESTING',
  'RESOLVED',
  'CLOSED',
] as const;

export const ALL_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const ALL_STATUSES_ARRAY = [...ALL_STATUSES];
export const ALL_PRIORITIES_ARRAY = [...ALL_PRIORITIES];

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries
// ─────────────────────────────────────────────────────────────────────────────

// Safe timestamp range: 2000-01-01 to 2099-12-31 in milliseconds
const MIN_TS = new Date('2000-01-01T00:00:00.000Z').getTime(); // 946684800000
const MAX_TS = new Date('2099-12-31T23:59:59.999Z').getTime(); // 4102444799999

/**
 * Generates a valid ISO date string within a safe range.
 * Uses integer timestamps to avoid Invalid Date edge cases during shrinking.
 */
const safeIsoDate = () =>
  fc
    .integer({ min: MIN_TS, max: MAX_TS })
    .map((ts) => new Date(ts).toISOString());

/**
 * Generates a full Ticket-shaped object with all required fields.
 */
export function arbitraryTicket() {
  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ maxLength: 500 }),
    status: fc.constantFrom(...ALL_STATUSES),
    priority: fc.constantFrom(...ALL_PRIORITIES),
    assignedToId: fc.option(fc.uuid(), { nil: null }),
    customerId: fc.option(fc.uuid(), { nil: null }),
    applicationId: fc.option(fc.uuid(), { nil: null }),
    dueDate: fc.option(safeIsoDate(), { nil: null }),
    slaDeadline: fc.option(safeIsoDate(), { nil: null }),
    isDeleted: fc.boolean(),
    deletedAt: fc.option(safeIsoDate(), { nil: null }),
    createdAt: safeIsoDate(),
    updatedAt: safeIsoDate(),
    // Required by Ticket interface
    createdById: fc.uuid(),
    createdBy: fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      email: fc.emailAddress(),
    }),
  });
}

/**
 * Generates a TicketFilters object with optional fields.
 */
export function arbitraryTicketFilters() {
  return fc.record({
    search: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
    status: fc.option(fc.constantFrom(...ALL_STATUSES), { nil: undefined }),
    priority: fc.option(fc.constantFrom(...ALL_PRIORITIES), { nil: undefined }),
    overdue: fc.option(fc.boolean(), { nil: undefined }),
    deleted: fc.option(fc.boolean(), { nil: undefined }),
  });
}

/**
 * Generates a minimal ticket-like object with SLA fields for SLA tests.
 */
export function arbitraryTicketWithSla() {
  return fc.record({
    id: fc.uuid(),
    status: fc.constantFrom(...ALL_STATUSES),
    slaDeadline: fc.option(safeIsoDate(), { nil: null }),
    isDeleted: fc.boolean(),
  });
}

/**
 * Generates a SolutionStep object.
 */
export function arbitrarySolutionStep() {
  return fc.record({
    order: fc.nat(),
    text: fc.string({ minLength: 1, maxLength: 200 }),
    done: fc.boolean(),
  });
}
