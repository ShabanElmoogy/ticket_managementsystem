/**
 * stepUtils.ts — Pure solution step manipulation utilities.
 *
 * No side effects, no React hooks, no API calls.
 */

import type { SolutionStep } from '@/src/services/api/types/programming';

// Re-export SolutionStep for convenience
export type { SolutionStep };

// ─────────────────────────────────────────────────────────────────────────────
// addStep
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a new step to the end of the steps array.
 *
 * The new step gets:
 *   order = steps.length  (appended at the end)
 *   done  = false
 *   text  = the provided text
 *
 * Returns a new array — does not mutate the input.
 *
 * Property: addStep(steps, text).length === steps.length + 1
 */
export function addStep(steps: SolutionStep[], text: string): SolutionStep[] {
  const newStep: SolutionStep = {
    order: steps.length,
    text,
    done: false,
  };
  return [...steps, newStep];
}

// ─────────────────────────────────────────────────────────────────────────────
// removeStep
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Removes the step at the given index and re-indexes remaining steps
 * so that order values are contiguous [0, 1, 2, ...].
 *
 * Returns a new array — does not mutate the input.
 * If index is out of bounds, returns a copy of the original array (no-op).
 *
 * Property: removeStep(steps, i).every((s, j) => s.order === j)
 */
export function removeStep(steps: SolutionStep[], index: number): SolutionStep[] {
  if (index < 0 || index >= steps.length) {
    return steps.map((s, i) => ({ ...s, order: i }));
  }
  return steps
    .filter((_, i) => i !== index)
    .map((step, i) => ({ ...step, order: i }));
}
