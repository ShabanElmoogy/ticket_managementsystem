/**
 * errorCodes.ts — structured API error code detection utilities.
 *
 * Single source of truth for mapping backend errorCode values to typed checks.
 * Import from here — never inline substring matching in feature screens.
 *
 * Backend source of truth: api/src/errors/index.js → SAFE_ERROR_CODES
 */

import type { ErrorReason } from '@/src/components/NetworkErrorDialog/types';
import { getErrorCode, getErrorMessage } from '@/src/shared/utils/httpUtils';

// ── Known backend error codes ─────────────────────────────────────────────────

/** All error codes the backend may include in a 4xx response body. */
export const API_ERROR_CODES = {
  /** Entity has related records — triggers force-delete escalation flow. */
  ASSOCIATED_DATA: 'ASSOCIATED_DATA',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// ── Backend errorCode → UI ErrorReason mapping ────────────────────────────────
//
// This is the ONLY place where backend SCREAMING_SNAKE codes are mapped to
// UI snake_case ErrorReason values. httpClient imports this map — never
// hardcodes the conversion inline.
//
// To add a new code:
//   1. Add to API_ERROR_CODES above
//   2. Add to ErrorReason union in NetworkErrorDialog/types.ts
//   3. Add the mapping entry here

export const ERROR_REASON_BY_CODE: Readonly<Record<ApiErrorCode, ErrorReason>> = {
  [API_ERROR_CODES.ASSOCIATED_DATA]: 'associated_data',
};

// ── Detection helpers ─────────────────────────────────────────────────────────

/**
 * Returns true when the API error indicates the entity has associated data
 * that prevents a normal delete (backend returns errorCode: 'ASSOCIATED_DATA').
 *
 * Detection strategy:
 *   1. Structured check — response.data.errorCode === 'ASSOCIATED_DATA' (preferred)
 *   2. Substring fallback — only when errorCode is absent (older API versions)
 *
 * Used by: UsersScreen, any future screen with force-delete escalation.
 */
export function isAssociatedDataError(error: unknown): boolean {
  const code = getErrorCode(error);

  // Structured check — stable, locale-independent
  if (code !== undefined) {
    return code === API_ERROR_CODES.ASSOCIATED_DATA;
  }

  // Fallback — substring match only when no errorCode field is present
  return getErrorMessage(error).toLowerCase().includes('associated');
}
