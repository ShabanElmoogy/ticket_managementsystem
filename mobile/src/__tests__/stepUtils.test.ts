/**
 * stepUtils.test.ts — Property-based tests for programming phase filter and step utilities.
 *
 * Feature: mobile-dashboard-programming-tickets
 * Properties tested:
 *   P7:  programming phase filter invariant
 *   P9:  add step increases length by 1
 *   P10: remove step re-indexes contiguously
 */

import * as fc from 'fast-check';
import { addStep, removeStep } from '../features/programming/utils/stepUtils';
import { isProgrammingPhase, PROGRAMMING_STATUSES } from '../features/tickets/utils/slaUtils';
import { arbitraryTicket, arbitrarySolutionStep, ALL_STATUSES } from './arbitraries/ticketArbitraries';
import type { Ticket } from '../services/api/types/ticket';
import type { SolutionStep } from '../services/api/types/programming';

// ─────────────────────────────────────────────────────────────────────────────
// P7 — Programming phase filter invariant
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 13.5, 18.20
 *
 * For any ticket array, every ticket where isProgrammingPhase(t.status) is true
 * has status in PROGRAMMING_STATUSES, and isProgrammingPhase returns false for
 * all other statuses.
 */
describe('P7: programming phase filter invariant', () => {
  it('isProgrammingPhase returns true only for PROGRAMMING_STATUSES', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 7: programming phase filter invariant
    fc.assert(
      fc.property(fc.array(arbitraryTicket()), (tickets) => {
        const programmingTickets = (tickets as unknown as Ticket[]).filter((t) =>
          isProgrammingPhase(t.status),
        );
        return programmingTickets.every((t) =>
          (PROGRAMMING_STATUSES as readonly string[]).includes(t.status),
        );
      }),
      { numRuns: 100 },
    );
  });

  it('isProgrammingPhase returns false for all non-programming statuses', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 7: programming phase filter invariant
    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATUSES), (status) => {
        const inProgramming = (PROGRAMMING_STATUSES as readonly string[]).includes(status);
        return isProgrammingPhase(status) === inProgramming;
      }),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P9 — Add step increases length by 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 15.9
 *
 * For any SolutionStep[] array and any non-empty step text,
 * addStep(steps, text).length === steps.length + 1
 */
describe('P9: add step increases length by 1', () => {
  it('addStep always increases array length by exactly 1', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 9: add step increases length by 1
    fc.assert(
      fc.property(
        fc.array(arbitrarySolutionStep()),
        fc.string({ minLength: 1 }),
        (steps, text) => {
          const result = addStep(steps as SolutionStep[], text);
          return result.length === steps.length + 1;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P10 — Remove step re-indexes contiguously
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 15.10
 *
 * For any non-empty SolutionStep[] array and any valid index i,
 * removeStep(steps, i).every((s, j) => s.order === j)
 */
describe('P10: remove step re-indexes contiguously', () => {
  it('removeStep produces contiguous order values [0, 1, 2, ...]', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 10: remove step re-indexes contiguously
    fc.assert(
      fc.property(
        fc.array(arbitrarySolutionStep(), { minLength: 1 }),
        fc.nat(),
        (steps, rawIndex) => {
          const index = rawIndex % steps.length;
          const result = removeStep(steps as SolutionStep[], index);
          return result.every((s, j) => s.order === j);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Example-based unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('addStep — example-based', () => {
  it('adds a step to an empty array', () => {
    const result = addStep([], 'First step');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ order: 0, text: 'First step', done: false });
  });

  it('adds a step to a non-empty array', () => {
    const steps: SolutionStep[] = [
      { order: 0, text: 'Step 1', done: false },
      { order: 1, text: 'Step 2', done: true },
    ];
    const result = addStep(steps, 'Step 3');
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ order: 2, text: 'Step 3', done: false });
  });

  it('does not mutate the original array', () => {
    const steps: SolutionStep[] = [{ order: 0, text: 'Step 1', done: false }];
    addStep(steps, 'Step 2');
    expect(steps).toHaveLength(1);
  });

  it('new step has done = false', () => {
    const result = addStep([], 'New step');
    expect(result[0].done).toBe(false);
  });
});

describe('removeStep — example-based', () => {
  it('removes the step at the given index', () => {
    const steps: SolutionStep[] = [
      { order: 0, text: 'Step 1', done: false },
      { order: 1, text: 'Step 2', done: false },
      { order: 2, text: 'Step 3', done: false },
    ];
    const result = removeStep(steps, 1);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Step 1');
    expect(result[1].text).toBe('Step 3');
  });

  it('re-indexes remaining steps contiguously', () => {
    const steps: SolutionStep[] = [
      { order: 0, text: 'Step 1', done: false },
      { order: 1, text: 'Step 2', done: false },
      { order: 2, text: 'Step 3', done: false },
    ];
    const result = removeStep(steps, 0);
    expect(result[0].order).toBe(0);
    expect(result[1].order).toBe(1);
  });

  it('removes the last step', () => {
    const steps: SolutionStep[] = [
      { order: 0, text: 'Step 1', done: false },
      { order: 1, text: 'Step 2', done: false },
    ];
    const result = removeStep(steps, 1);
    expect(result).toHaveLength(1);
    expect(result[0].order).toBe(0);
  });

  it('does not mutate the original array', () => {
    const steps: SolutionStep[] = [
      { order: 0, text: 'Step 1', done: false },
      { order: 1, text: 'Step 2', done: false },
    ];
    removeStep(steps, 0);
    expect(steps).toHaveLength(2);
  });

  it('handles out-of-bounds index gracefully', () => {
    const steps: SolutionStep[] = [{ order: 0, text: 'Step 1', done: false }];
    const result = removeStep(steps, 5);
    expect(result).toHaveLength(1);
    expect(result[0].order).toBe(0);
  });
});
