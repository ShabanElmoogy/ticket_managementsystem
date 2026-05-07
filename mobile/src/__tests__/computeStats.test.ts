/**
 * computeStats.test.ts — Property-based tests for computeStats and filterTickets.
 *
 * Feature: mobile-dashboard-programming-tickets
 * Properties tested:
 *   P1: stats sum invariant
 *   P2: filter reduces count
 *   P3: status filter correctness
 */

import * as fc from 'fast-check';
import { computeStats, filterTickets } from '../features/dashboard/utils/computeStats';
import {
  arbitraryTicket,
  arbitraryTicketFilters,
  ALL_STATUSES,
} from './arbitraries/ticketArbitraries';
import type { Ticket } from '../services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Stats sum invariant
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 1.5
 *
 * For any array of tickets, the sum of per-status counts SHALL equal the total:
 *   open + inProgress + programming + resolved + closed === total
 */
describe('P1: stats sum invariant', () => {
  it('open + inProgress + programming + resolved + closed === total for any ticket array', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 1: stats sum invariant
    fc.assert(
      fc.property(fc.array(arbitraryTicket()), (tickets) => {
        const stats = computeStats(tickets as unknown as Ticket[]);
        return (
          stats.open +
            stats.inProgress +
            stats.programming +
            stats.resolved +
            stats.closed ===
          stats.total
        );
      }),
      { numRuns: 100 },
    );
  });

  it('total equals tickets.length', () => {
    fc.assert(
      fc.property(fc.array(arbitraryTicket()), (tickets) => {
        const stats = computeStats(tickets as unknown as Ticket[]);
        return stats.total === tickets.length;
      }),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P2 — Filter reduces count
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 2.7
 *
 * For any ticket array and any filter combination, the filtered count SHALL be
 * less than or equal to the unfiltered count.
 */
describe('P2: filter reduces count', () => {
  it('filterTickets(tickets, filters).length <= tickets.length for any inputs', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 2: filter reduces count
    fc.assert(
      fc.property(
        fc.array(arbitraryTicket()),
        arbitraryTicketFilters(),
        (tickets, filters) => {
          const filtered = filterTickets(tickets as unknown as Ticket[], filters);
          return filtered.length <= tickets.length;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P3 — Status filter correctness
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 2.8
 *
 * For any ticket array and any selected status, every ticket in the filtered
 * result SHALL have that exact status.
 */
describe('P3: status filter correctness', () => {
  it('every ticket in status-filtered result has the selected status', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 3: status filter correctness
    fc.assert(
      fc.property(
        fc.array(arbitraryTicket()),
        fc.constantFrom(...ALL_STATUSES),
        (tickets, status) => {
          const filtered = filterTickets(tickets as unknown as Ticket[], { status });
          return filtered.every((t) => t.status === status);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Example-based unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('computeStats — example-based', () => {
  it('returns all zeros for empty array', () => {
    const stats = computeStats([]);
    expect(stats).toEqual({
      total: 0,
      open: 0,
      inProgress: 0,
      programming: 0,
      resolved: 0,
      closed: 0,
    });
  });

  it('counts each status bucket correctly', () => {
    const tickets = [
      { status: 'OPEN' },
      { status: 'OPEN' },
      { status: 'IN_PROGRESS' },
      { status: 'PROGRAMMING' },
      { status: 'UNDER_DEVELOPMENT' },
      { status: 'CODE_REVIEW' },
      { status: 'TESTING' },
      { status: 'RESOLVED' },
      { status: 'CLOSED' },
    ] as unknown as Ticket[];

    const stats = computeStats(tickets);
    expect(stats.total).toBe(9);
    expect(stats.open).toBe(2);
    expect(stats.inProgress).toBe(1);
    expect(stats.programming).toBe(4);
    expect(stats.resolved).toBe(1);
    expect(stats.closed).toBe(1);
    expect(stats.open + stats.inProgress + stats.programming + stats.resolved + stats.closed).toBe(
      stats.total,
    );
  });
});

describe('filterTickets — example-based', () => {
  const tickets = [
    { id: '1', title: 'Login bug', description: 'Cannot login', status: 'OPEN', priority: 'HIGH', assignedToId: 'u1', customerId: 'c1', applicationId: 'a1', dueDate: null, deletedAt: null },
    { id: '2', title: 'Dashboard crash', description: 'App crashes', status: 'IN_PROGRESS', priority: 'URGENT', assignedToId: 'u2', customerId: 'c2', applicationId: 'a2', dueDate: null, deletedAt: null },
    { id: '3', title: 'Export feature', description: 'PDF export', status: 'RESOLVED', priority: 'LOW', assignedToId: null, customerId: null, applicationId: null, dueDate: null, deletedAt: '2024-01-01T00:00:00Z' },
  ] as unknown as Ticket[];

  it('returns all tickets when no filters applied', () => {
    expect(filterTickets(tickets, {})).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = filterTickets(tickets, { status: 'OPEN' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by search query (title)', () => {
    const result = filterTickets(tickets, { search: 'login' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by search query (description)', () => {
    const result = filterTickets(tickets, { search: 'crashes' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filters by priority', () => {
    const result = filterTickets(tickets, { priority: 'HIGH' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters deleted tickets', () => {
    const result = filterTickets(tickets, { deleted: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('filters non-deleted tickets', () => {
    const result = filterTickets(tickets, { deleted: false });
    expect(result).toHaveLength(2);
  });
});
