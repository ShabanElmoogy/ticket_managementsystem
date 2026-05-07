/**
 * slaUtils.test.ts — Property-based tests for computeSlaState and isProgrammingPhase.
 *
 * Feature: mobile-dashboard-programming-tickets
 * Properties tested:
 *   P6: SLA overdue logic invariant
 */

import * as fc from 'fast-check';
import { computeSlaState, isProgrammingPhase, PROGRAMMING_STATUSES } from '../features/tickets/utils/slaUtils';
import { arbitraryTicketWithSla } from './arbitraries/ticketArbitraries';

// Safe timestamp range for generating 'now' dates
const MIN_TS = new Date('2000-01-01T00:00:00.000Z').getTime();
const MAX_TS = new Date('2099-12-31T23:59:59.999Z').getTime();
const safeDate = () => fc.integer({ min: MIN_TS, max: MAX_TS }).map((ts) => new Date(ts));

// ─────────────────────────────────────────────────────────────────────────────
// P6 — SLA overdue logic invariant
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 12.5
 *
 * For any ticket with slaDeadline and any date `now`:
 *   computeSlaState(ticket, now).isOverdue === (
 *     ticket.slaDeadline != null &&
 *     new Date(ticket.slaDeadline) < now &&
 *     !['RESOLVED', 'CLOSED'].includes(ticket.status)
 *   )
 */
describe('P6: SLA overdue logic invariant', () => {
  it('isOverdue matches expected logic for any ticket and date', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 6: SLA overdue logic invariant
    fc.assert(
      fc.property(arbitraryTicketWithSla(), safeDate(), (ticket, now) => {
        const state = computeSlaState(ticket, now);
        const expectedOverdue =
          ticket.slaDeadline != null &&
          new Date(ticket.slaDeadline) < now &&
          !['RESOLVED', 'CLOSED'].includes(ticket.status);
        return state.isOverdue === expectedOverdue;
      }),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Example-based unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('computeSlaState — example-based', () => {
  const now = new Date('2024-06-15T12:00:00Z');

  it('returns success state when no slaDeadline', () => {
    const result = computeSlaState({ slaDeadline: null, status: 'OPEN' }, now);
    expect(result).toEqual({ isOverdue: false, displayText: '', colorToken: 'success' });
  });

  it('returns success state when slaDeadline is undefined', () => {
    const result = computeSlaState({ slaDeadline: undefined, status: 'OPEN' }, now);
    expect(result).toEqual({ isOverdue: false, displayText: '', colorToken: 'success' });
  });

  it('returns error state when deadline is past and status is OPEN', () => {
    const pastDeadline = '2024-06-15T10:00:00Z'; // 2 hours before now
    const result = computeSlaState({ slaDeadline: pastDeadline, status: 'OPEN' }, now);
    expect(result.isOverdue).toBe(true);
    expect(result.colorToken).toBe('error');
    expect(result.displayText).toContain('overdue');
  });

  it('returns success state when deadline is past but status is RESOLVED', () => {
    const pastDeadline = '2024-06-15T10:00:00Z';
    const result = computeSlaState({ slaDeadline: pastDeadline, status: 'RESOLVED' }, now);
    expect(result.isOverdue).toBe(false);
    expect(result.colorToken).toBe('success');
  });

  it('returns success state when deadline is past but status is CLOSED', () => {
    const pastDeadline = '2024-06-15T10:00:00Z';
    const result = computeSlaState({ slaDeadline: pastDeadline, status: 'CLOSED' }, now);
    expect(result.isOverdue).toBe(false);
  });

  it('returns warning state when deadline is within 2 hours', () => {
    const soonDeadline = '2024-06-15T13:30:00Z'; // 1.5 hours from now
    const result = computeSlaState({ slaDeadline: soonDeadline, status: 'OPEN' }, now);
    expect(result.isOverdue).toBe(false);
    expect(result.colorToken).toBe('warning');
    expect(result.displayText).toContain('left');
  });

  it('returns success state when deadline is more than 2 hours away', () => {
    const futureDeadline = '2024-06-15T15:00:00Z'; // 3 hours from now
    const result = computeSlaState({ slaDeadline: futureDeadline, status: 'OPEN' }, now);
    expect(result.isOverdue).toBe(false);
    expect(result.colorToken).toBe('success');
    expect(result.displayText).toContain('left');
  });
});

describe('isProgrammingPhase — example-based', () => {
  it('returns true for all programming phase statuses', () => {
    for (const status of PROGRAMMING_STATUSES) {
      expect(isProgrammingPhase(status)).toBe(true);
    }
  });

  it('returns false for OPEN', () => {
    expect(isProgrammingPhase('OPEN')).toBe(false);
  });

  it('returns false for IN_PROGRESS', () => {
    expect(isProgrammingPhase('IN_PROGRESS')).toBe(false);
  });

  it('returns false for CLOSED', () => {
    expect(isProgrammingPhase('CLOSED')).toBe(false);
  });

  it('returns false for unknown status', () => {
    expect(isProgrammingPhase('UNKNOWN')).toBe(false);
  });
});
