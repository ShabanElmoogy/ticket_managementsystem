/**
 * requestDeduplicator — deduplicates identical in-flight GET requests.
 *
 * Problem: React Query fires multiple identical queries simultaneously
 * (e.g. 3 components all mount and call GET /tickets at the same time).
 * Without deduplication, 3 network requests go out. With it, only 1 does
 * and all 3 callers share the same Promise.
 *
 * Scope: GET requests only. Mutations (POST/PUT/PATCH/DELETE) are never
 * deduplicated — they have side effects and must each execute independently.
 *
 * Key: `METHOD:URL?serialized_params`
 * Two requests are considered identical if they have the same method, URL,
 * and query params. Request body and headers are intentionally excluded —
 * GET requests don't have bodies, and header differences (e.g. X-Request-ID)
 * should not create separate cache entries.
 *
 * Lifecycle: the in-flight entry is removed as soon as the request settles
 * (resolve or reject). Subsequent requests for the same key start fresh.
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios';

// ── Types ─────────────────────────────────────────────────────────────────────

type RequestExecutor = (config: AxiosRequestConfig) => Promise<AxiosResponse>;

// ── State ─────────────────────────────────────────────────────────────────────

// Map of deduplication key → in-flight Promise
const inFlight = new Map<string, Promise<AxiosResponse>>();

// ── Key builder ───────────────────────────────────────────────────────────────

function buildKey(config: AxiosRequestConfig): string | null {
  const method = (config.method ?? 'get').toLowerCase();

  // Only deduplicate GET requests
  if (method !== 'get') return null;

  const url    = config.url ?? '';
  const params = config.params
    ? '?' + new URLSearchParams(
        Object.entries(config.params)
          .filter(([, v]) => v !== undefined && v !== null)
          .sort(([a], [b]) => a.localeCompare(b)) // stable sort for consistent keys
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';

  return `GET:${url}${params}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const requestDeduplicator = {
  /**
   * Execute a request, deduplicating identical in-flight GETs.
   *
   * @param config  Axios request config
   * @param execute Function that actually fires the HTTP request
   * @returns       The Axios response (shared if deduplicated)
   */
  execute: (
    config:  AxiosRequestConfig,
    execute: RequestExecutor,
  ): Promise<AxiosResponse> => {
    const key = buildKey(config);

    // Non-GET or no key — execute directly, no deduplication
    if (!key) return execute(config);

    // Already in flight — return the existing Promise
    const existing = inFlight.get(key);
    if (existing) {
      if (__DEV__) {
        console.log(`♻️  [Dedup] Sharing in-flight request: ${key}`);
      }
      return existing;
    }

    // First caller — execute and register
    const promise = execute(config).finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, promise);

    if (__DEV__) {
      console.log(`🔑 [Dedup] New request: ${key} (${inFlight.size} in-flight)`);
    }

    return promise;
  },

  /** Current in-flight count — for debugging. */
  size: () => inFlight.size,

  /**
   * Clear all in-flight entries.
   * Call on logout to prevent stale shared promises from resolving
   * with data from the previous session.
   */
  clear: () => {
    inFlight.clear();
  },
};
