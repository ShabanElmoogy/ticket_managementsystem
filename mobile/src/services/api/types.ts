/**
 * types.ts — shared API types used across httpClient, httpUtils, and errorCodes.
 *
 * Kept in a standalone file to avoid circular imports:
 *   httpClient → errorCodes → httpUtils → (was httpClient, now this file)
 */

export type ApiError = {
  status?:     number;
  message:     string;
  details?:    unknown;
  code?:       string;
  isRetryable?: boolean;
};
