/**
 * errorCodes.ts — structured API error code detection utilities.
 *
 * Single source of truth for mapping backend errorCode values to typed checks.
 * Import from here — never inline substring matching in feature screens.
 *
 * Backend source of truth: api/src/errors/index.js → SAFE_ERROR_CODES
 */

// ── Known backend error codes ─────────────────────────────────────────────────

/** All error codes the backend may include in a 4xx response body. */
export const API_ERROR_CODES = {
  /** Entity has related records — triggers force-delete escalation flow. */
  ASSOCIATED_DATA: 'ASSOCIATED_DATA',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// ── Detection helpers ─────────────────────────────────────────────────────────

/**
 * Extract the structured errorCode from an API error response.
 * Returns undefined if no code is present.
 */
function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    const e = error as any;
    return e?.response?.data?.errorCode ?? undefined;
  }
  return undefined;
}

/**
 * Extract the error message string from an API error response.
 * Checks response.data.error, then error.message.
 */
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as any;
    return e?.response?.data?.error ?? e?.message ?? '';
  }
  return '';
}

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
