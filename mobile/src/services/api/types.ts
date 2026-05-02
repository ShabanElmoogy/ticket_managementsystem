/**
 * types.ts — shared API types used across httpClient, httpUtils, and errorCodes.
 *
 * Kept in a standalone file to avoid circular imports:
 *   httpClient → errorCodes → httpUtils → (was httpClient, now this file)
 */

export type ApiError = {
  status?:      number;
  message:      string;
  details?:     unknown;
  code?:        string;
  isRetryable?: boolean;
};

// ── Error reason ──────────────────────────────────────────────────────────────
//
// Defined here (not in NetworkErrorDialog/types.ts) so ERROR_REASON_MAP can be
// typed without creating an import from this file into the UI layer.
// NetworkErrorDialog/types.ts re-exports this type for UI consumers.
//
// Add new values here when adding a new backend errorCode.

export type ErrorReason = 'associated_data';

// ── Error reason mapping ──────────────────────────────────────────────────────
//
// Single source of truth for backend SCREAMING_SNAKE errorCode → UI ErrorReason.
// Both httpClient (emitter) and errorCodes (detector) import from here.
// No other imports in this file — keeps the dependency graph acyclic.
//
// To add a new code:
//   1. Add the backend code string to API_ERROR_CODES in errorCodes.ts
//   2. Add the new ErrorReason value above
//   3. Add the mapping entry here

export const ERROR_REASON_MAP: Readonly<Record<string, ErrorReason>> = {
  ASSOCIATED_DATA: 'associated_data',
};
