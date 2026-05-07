/**
 * mentionUtils.test.ts — Property-based tests for extractMentions and formatMentions.
 *
 * Feature: mobile-dashboard-programming-tickets
 * Properties tested:
 *   P5: mention round-trip
 */

import * as fc from 'fast-check';
import { extractMentions, formatMentions } from '../features/tickets/utils/mentionUtils';

// ─────────────────────────────────────────────────────────────────────────────
// P5 — Mention round-trip
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 11.4
 *
 * For any array of single-word alphanumeric names, formatting them as @name
 * tokens and then extracting the mentions SHALL produce the same set of names.
 *
 * extractMentions(formatMentions(names)) deepEquals names (sorted)
 */
describe('P5: mention round-trip', () => {
  it('extractMentions(formatMentions(names)) deepEquals names for single-word names', () => {
    // Feature: mobile-dashboard-programming-tickets, Property 5: mention round-trip
    fc.assert(
      fc.property(
        // Generate arrays of single-word alphanumeric names (no spaces, no special chars)
        fc.array(
          fc.stringMatching(/^[a-zA-Z0-9]+$/).filter((s) => s.length >= 1 && s.length <= 30),
        ),
        (names) => {
          const formatted = formatMentions(names);
          const extracted = extractMentions(formatted);
          return JSON.stringify(extracted.sort()) === JSON.stringify([...names].sort());
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Example-based unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('extractMentions — example-based', () => {
  it('returns empty array for text with no mentions', () => {
    expect(extractMentions('Hello world')).toEqual([]);
  });

  it('extracts a single mention', () => {
    expect(extractMentions('Hello @alice')).toEqual(['alice']);
  });

  it('extracts multiple mentions', () => {
    expect(extractMentions('Hello @alice and @bob!')).toEqual(['alice', 'bob']);
  });

  it('extracts mentions from middle of text', () => {
    expect(extractMentions('cc @charlie for review')).toEqual(['charlie']);
  });

  it('returns empty array for empty string', () => {
    expect(extractMentions('')).toEqual([]);
  });

  it('handles @ with no word after it', () => {
    expect(extractMentions('email@domain.com')).toEqual(['domain']);
  });
});

describe('formatMentions — example-based', () => {
  it('returns empty string for empty array', () => {
    expect(formatMentions([])).toBe('');
  });

  it('formats a single name', () => {
    expect(formatMentions(['alice'])).toBe('@alice');
  });

  it('formats multiple names with spaces', () => {
    expect(formatMentions(['alice', 'bob'])).toBe('@alice @bob');
  });

  it('prefixes each name with @', () => {
    const result = formatMentions(['alice', 'bob', 'charlie']);
    expect(result).toBe('@alice @bob @charlie');
  });
});
