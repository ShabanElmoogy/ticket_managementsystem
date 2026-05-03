import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from './tokenManager';
import { networkEvents } from './networkEvents';
import { authEvents } from './authEvents';
import { circuitBreaker } from './circuitBreaker';
import { requestDeduplicator } from './requestDeduplicator';
import { HTTP_STATUS } from '@/src/constants/api';
import type { ApiError } from './httpTypes';
import { ERROR_REASON_MAP } from './httpTypes';

// Re-export so existing consumers of `import type { ApiError } from './httpClient'` keep working
export type { ApiError } from './httpTypes';

// Extend config type to carry our retry flags
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?:          boolean; // prevents infinite 401 retry loop
  _preValidated?:     boolean; // marks requests that already went through pre-validation
}

// ─────────────────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────────────────

export const REQUEST_TIMEOUT = 30_000; // 30s — mobile networks are slower

/**
 * API base URL — resolved by platform:
 *   - EXPO_PUBLIC_API_URL env var (set in .env / .env.local)
 *   - Web fallback: localhost (browser runs on same machine as API)
 *   - Native fallback: remote API
 */
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ?? (Platform.OS === 'web'
    ? 'http://localhost:3001/api/v1'          // web dev: API on same machine
    : 'https://shabanapi.runasp.net/api/v1'); // native: remote API

/**
 * `http`  — the main client used everywhere in the app.
 * `refreshClient` — a SEPARATE bare instance used only for token refresh.
 *                   It has NO interceptors, so a failed refresh never
 *                   re-enters the 401 handler and causes an infinite loop.
 */
export const http = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Bare client — NO interceptors. Used only for token refresh calls
// to prevent the 401 handler from re-entering and causing infinite loops.
export const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Clock skew compensation
//
// The server clock may differ from the device clock (common on IIS/Windows
// servers where the time service drifts). Without compensation, a server that
// is 1 hour behind will issue tokens that appear to expire immediately from
// the device's perspective (exp - iat = 3600s but exp - deviceNow = 18s).
//
// We measure skew from the HTTP Date response header on every response and
// store a rolling estimate. All "time remaining" calculations use:
//   msUntilExpiry = exp * 1000 - (Date.now() - clockSkewMs)
//
// where clockSkewMs = deviceTime - serverTime (positive = device is ahead).
// ─────────────────────────────────────────────────────────────────────────────

let clockSkewMs = 0; // device time minus server time, in milliseconds

/** Update clock skew estimate from an HTTP Date header value. */
function updateClockSkew(serverDateHeader: string | null): void {
  if (!serverDateHeader) return;
  const serverTime = Date.parse(serverDateHeader);
  if (isNaN(serverTime)) return;
  const skew = Date.now() - serverTime;
  // Only update if the skew is significant (> 5s) to avoid noise from
  // network latency. Cap at ±24h to reject obviously wrong values.
  if (Math.abs(skew) > 5_000 && Math.abs(skew) < 86_400_000) {
    clockSkewMs = skew;
    if (__DEV__ && Math.abs(skew) > 30_000) {
      console.warn(
        `⏰ [CLOCK SKEW] Server is ${skew > 0 ? 'behind' : 'ahead'} by` +
        ` ${Math.round(Math.abs(skew) / 1000)}s.` +
        ` Token expiry calculations adjusted.`
      );
    }
  }
}

/** Current server time estimate, adjusted for clock skew. */
function serverNowMs(): number {
  return Date.now() - clockSkewMs;
}

// All thresholds are computed as a fraction of the token's actual lifetime
// so the system works correctly regardless of what the server issues.
//
//   PROACTIVE_RATIO    = refresh when this fraction of lifetime remains
//                        e.g. 0.25 of a 15m token → refresh at 3m45s remaining
//                        e.g. 0.25 of a  1m token → refresh at 15s remaining
//
//   PRE_VALIDATE_RATIO = inline-refresh in request interceptor when this
//                        fraction of lifetime remains (must be < PROACTIVE_RATIO)
//                        e.g. 0.10 of a 15m token → 90s remaining
//                        e.g. 0.10 of a  1m token → 6s remaining
//
//   MIN_PROACTIVE_LIFETIME_MS = minimum token lifetime for proactive scheduling.
//                        Tokens shorter than this are too short to schedule a
//                        proactive refresh — the pre-validate interceptor handles
//                        them instead. Prevents the 5s-loop on very short tokens.
//
// The iat (issued-at) claim is used to compute lifetime. If iat is absent
// (non-standard server), we fall back to a conservative 15-minute assumption.
// ─────────────────────────────────────────────────────────────────────────────

const PROACTIVE_RATIO             = 0.25;       // refresh when 25% of lifetime remains
const PRE_VALIDATE_RATIO          = 0.10;       // inline-refresh when 10% of lifetime remains
const MIN_PROACTIVE_LIFETIME_MS   = 30_000;     // don't schedule proactive for tokens < 30s lifetime
const MIN_SCHEDULE_MS             = 5_000;      // never fire sooner than 5s (floor)

/**
 * Decode both exp and iat from a JWT safely.
 * Returns null if the token is malformed or exp is missing.
 * msRemaining is computed using serverNowMs() to compensate for clock skew.
 */
function getTokenClaims(token: string): {
  exp: number;
  iat: number;
  lifetimeMs: number;
  msRemaining: number;
} | null {
  try {
    const base64url = token.split('.')[1];
    if (!base64url) return null;
    const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(base64url.length / 4) * 4, '=');
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp !== 'number') return null;
    const iat         = typeof payload.iat === 'number' ? payload.iat : payload.exp - 15 * 60;
    const lifetimeMs  = (payload.exp - iat) * 1000;
    const msRemaining = payload.exp * 1000 - serverNowMs();
    return { exp: payload.exp, iat, lifetimeMs, msRemaining };
  } catch {
    return null;
  }
}

/** Returns only exp — for callers that don't need the full claims. */
function getTokenExp(token: string): number | null {
  return getTokenClaims(token)?.exp ?? null;
}

/**
 * Compute refresh thresholds from a token's actual lifetime.
 * Returns null if the token is malformed.
 */
function computeThresholds(token: string): { proactiveMs: number; preValidateMs: number } | null {
  const claims = getTokenClaims(token);
  if (!claims) return null;
  return {
    proactiveMs:   Math.round(claims.lifetimeMs * PROACTIVE_RATIO),
    preValidateMs: Math.round(claims.lifetimeMs * PRE_VALIDATE_RATIO),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Proactive refresh cycle
//
// Schedules a refresh PROACTIVE_RATIO before the token expires.
// For a 15m token: fires at 3m45s remaining (11m15s after issue).
// For a  1m token: fires at 15s remaining (45s after issue).
//
// Tokens shorter than MIN_PROACTIVE_LIFETIME_MS are not scheduled — the
// pre-validate interceptor handles them on the next request instead.
//
// The cycle reschedules itself after each successful refresh so the app
// never needs a 401 round-trip during normal operation.
// ─────────────────────────────────────────────────────────────────────────────

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function startTokenRefreshCycle(token: string): void {
  stopTokenRefreshCycle();

  const claims = getTokenClaims(token);
  if (!claims) return;

  const msUntilExpiry = claims.msRemaining;

  // Token already expired (server time) — nothing to schedule
  if (msUntilExpiry <= 0) {
    if (__DEV__) console.warn('⚠️ [REFRESH] startTokenRefreshCycle called with already-expired token — skipping');
    return;
  }

  // Token lifetime too short for proactive scheduling.
  // This catches the case where the server issues very short-lived tokens
  // (e.g. 17s) — scheduling a proactive refresh on a 17s token would fire
  // almost immediately and loop. The pre-validate interceptor handles these.
  if (claims.lifetimeMs < MIN_PROACTIVE_LIFETIME_MS) {
    if (__DEV__) console.log(
      `⏭ [REFRESH] Skipping proactive schedule — token lifetime ${Math.round(claims.lifetimeMs / 1000)}s` +
      ` is below minimum ${MIN_PROACTIVE_LIFETIME_MS / 1000}s. Pre-validate will handle it.`
    );
    return;
  }

  const proactiveMs = Math.round(claims.lifetimeMs * PROACTIVE_RATIO);

  // If less time remains than the proactive threshold, don't schedule —
  // the token is already in the "should refresh soon" window.
  // The pre-validate interceptor will catch it on the next request.
  if (msUntilExpiry <= proactiveMs) {
    if (__DEV__) console.log(
      `⏭ [REFRESH] Skipping proactive schedule — token expires in ${Math.round(msUntilExpiry / 1000)}s` +
      ` (within the ${Math.round(proactiveMs / 1000)}s refresh window). Pre-validate will handle it.`
    );
    return;
  }

  // Schedule refresh at (msUntilExpiry - proactiveMs), floored at MIN_SCHEDULE_MS
  const msUntilRefresh = Math.max(msUntilExpiry - proactiveMs, MIN_SCHEDULE_MS);

  if (__DEV__) {
    const expiresAt   = new Date(claims.exp * 1000).toISOString();
    const lifetimeSec = Math.round(claims.lifetimeMs / 1000);
    console.log(
      `⏱ [REFRESH] Proactive cycle scheduled in ${Math.round(msUntilRefresh / 1000)}s` +
      ` (lifetime: ${lifetimeSec}s, fires ${Math.round(proactiveMs / 1000)}s before expiry,` +
      ` expires at ${expiresAt})`
    );
  }

  refreshTimer = setTimeout(async () => {
    if (isRefreshing) {
      if (__DEV__) console.log('⏭ [REFRESH] Proactive skipped — reactive refresh in progress');
      return;
    }
    try {
      if (__DEV__) console.log('🔄 [REFRESH] Starting proactive token refresh...');
      const { newToken, newRefreshToken } = await callRefreshEndpoint();
      applyNewTokens(newToken, newRefreshToken);

      if (__DEV__) {
        const newClaims = getTokenClaims(newToken);
        const msLeft    = newClaims ? newClaims.exp * 1000 - Date.now() : 0;
        const expiresAt = newClaims ? new Date(newClaims.exp * 1000).toISOString() : 'unknown';
        console.log(
          `✅ [REFRESH] Token proactively refreshed.\n` +
          `   Expires at: ${expiresAt}\n` +
          `   Expires in: ${Math.round(msLeft / 60_000)}m (${Math.round(msLeft / 1000)}s)`
        );
      }

      startTokenRefreshCycle(newToken);
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        if (__DEV__) console.log('🔑 [REFRESH] Refresh token expired/revoked — logging out');
        try { authEvents.logout(); } catch { }
      } else if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        // 429 after the built-in retry — server is still throttling.
        // Reschedule in 30s using the current token so we try again before expiry.
        const currentToken = tokenManager.getToken();
        if (currentToken) {
          const c      = getTokenClaims(currentToken);
          const msLeft = c ? c.exp * 1000 - Date.now() : 0;
          if (msLeft > 30_000) {
            if (__DEV__) console.warn('⏳ [REFRESH] Still rate-limited — rescheduling in 30s');
            refreshTimer = setTimeout(() => startTokenRefreshCycle(currentToken), 30_000);
          } else {
            if (__DEV__) console.warn('⏳ [REFRESH] Rate-limited and token expiring soon — pre-validate will handle it');
          }
        }
      } else {
        if (__DEV__) console.warn('⚠️ [REFRESH] Proactive refresh failed:', err?.message ?? err);
        // Do NOT logout — let the reactive 401 interceptor handle it
      }
    }
  }, msUntilRefresh);
}

export function stopTokenRefreshCycle(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core refresh call — uses refreshClient (no interceptors!) to avoid loops
// Integrates circuit breaker: blocks refresh when OPEN, records outcomes.
// Exported so authStore.initializeAuth can use it on cold start (ensures
// circuit breaker tracks cold-start failures consistently).
//
// 429 handling: reads Retry-After header and waits before retrying once.
// 429 does NOT count as a circuit breaker failure — it is a transient
// server-side throttle, not an auth error.
// ─────────────────────────────────────────────────────────────────────────────

/** Parse Retry-After header → milliseconds. Defaults to `fallbackMs`. */
function parseRetryAfterMs(headers: Record<string, unknown>, fallbackMs: number): number {
  const raw = headers['retry-after'] ?? headers['Retry-After'];
  if (typeof raw === 'string') {
    const seconds = parseInt(raw, 10);
    if (!isNaN(seconds) && seconds > 0) return seconds * 1000;
  }
  return fallbackMs;
}

export async function callRefreshEndpoint(): Promise<{
  newToken: string;
  newRefreshToken: string;
}> {
  // Circuit open — don't even attempt the network call
  if (circuitBreaker.isOpen()) {
    const err = Object.assign(
      new Error('Session expired. Too many failed refresh attempts.'),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
    throw err;
  }

  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  if (__DEV__) {
    console.log('🔄 [REFRESH] Calling /auth/refresh with token:', refreshToken.slice(0, 20) + '...');
  }

  const attemptRefresh = async (): Promise<{
    token: string;
    refreshToken?: string;
    user?: { id: string; email: string; name: string; role: string };
  }> => {
    const response = await refreshClient.post<{
      token: string;
      refreshToken?: string;
      user?: { id: string; email: string; name: string; role: string };
    }>('/auth/refresh', { refreshToken });

    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Refresh response is not an object');
    }
    return response.data;
  };

  try {
    let data: Awaited<ReturnType<typeof attemptRefresh>>;

    try {
      data = await attemptRefresh();
    } catch (firstErr: any) {
      // ── 429 — wait for Retry-After then try once more ─────────────────────
      if (firstErr?.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        const waitMs = parseRetryAfterMs(
          firstErr.response.headers as Record<string, unknown>,
          5_000, // default 5s if header is absent
        );
        if (__DEV__) console.warn(`⏳ [REFRESH] Rate-limited (429) — retrying in ${Math.round(waitMs / 1000)}s`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        // Second attempt — if this also 429s, let it propagate as a 429 error
        data = await attemptRefresh();
      } else {
        throw firstErr;
      }
    }

    const newToken        = data.token;
    const newRefreshToken = data.refreshToken ?? refreshToken;

    if (!newToken)        throw new Error('Refresh response missing token');
    if (!newRefreshToken) throw new Error('Refresh response missing refreshToken');

    if (__DEV__) {
      const rotated = data.refreshToken && data.refreshToken !== refreshToken;
      console.log(`🔑 [REFRESH] Token refreshed. Refresh token ${rotated ? 'rotated ✅' : 'unchanged'}`);
    }

    // If the server returned an updated user object (e.g. role changed),
    // propagate it to the auth store so the UI reflects the latest state.
    if (data.user) {
      try {
        authEvents.setTokens(newToken, newRefreshToken);
      } catch { /* handler may not be registered yet on cold start */ }
    }

    // Success — reset circuit breaker failure counter
    circuitBreaker.recordSuccess();

    return { newToken, newRefreshToken };

  } catch (err: any) {
    const isNetworkErr = !err?.response;
    const isRateLimit  = err?.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS;
    // 429 and network errors do NOT count as circuit breaker failures
    circuitBreaker.recordFailure(isNetworkErr, isRateLimit);
    throw err;
  }
}

/**
 * Updates tokenManager synchronously AND Zustand store synchronously.
 * Both must happen before any retry fires — the request interceptor reads
 * from tokenManager, and Zustand persist writes to AsyncStorage immediately.
 * Exported so authStore.initializeAuth can apply tokens after cold-start refresh.
 */
export function applyNewTokens(newToken: string, newRefreshToken: string): void {
  // ⚠️ SYNCHRONOUS — must happen before any http.request() retry call
  tokenManager.setToken(newToken);
  if (newRefreshToken) tokenManager.setRefreshToken(newRefreshToken);

  // Persist to Zustand via authEvents — avoids circular import with authStore.
  try {
    authEvents.setTokens(newToken, newRefreshToken);
  } catch {
    // Handler not yet registered (very early in boot) — tokenManager is enough
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Request interceptor
// 1. Token pre-validation — refresh inline if expired before sending
// 2. Attach Authorization + X-Tenant-Slug + X-Request-ID headers
// 3. Deduplication — identical in-flight GETs share one Promise
// ─────────────────────────────────────────────────────────────────────────────

http.interceptors.request.use(async (config) => {
  const cfg = config as RetryableRequestConfig;

  // ── 1. Token pre-validation ───────────────────────────────────────────────
  // Check expiry BEFORE sending. If the token is within PRE_VALIDATE_RATIO of
  // its lifetime (e.g. 10% = 90s for a 15m token, 6s for a 1m token) and no
  // refresh is in flight, trigger one now. This eliminates the 401 round-trip
  // on the first request after a long background period.
  //
  // Guards:
  //  - Skip if already refreshing (reactive handler owns it)
  //  - Skip if circuit is open (session expired, don't hammer the server)
  //  - Skip if this config was already pre-validated (prevents re-entry)
  //  - Skip for the refresh endpoint itself
  if (
    !cfg._preValidated &&
    !isRefreshing &&
    !circuitBreaker.isOpen() &&
    !cfg.url?.includes('/auth/refresh')
  ) {
    const token = tokenManager.getToken();
    if (token) {
      const claims = getTokenClaims(token);

      // Malformed token — can't decode expiry, skip pre-validation.
      // The request will proceed and get a 401 if the token is invalid,
      // which the reactive handler will process normally.
      if (!claims) {
        if (__DEV__) console.warn('⚠️ [PRE-VALIDATE] Token is malformed — skipping pre-validation');
      } else {
        const msRemaining   = claims.msRemaining;
        const preValidateMs = Math.round(claims.lifetimeMs * PRE_VALIDATE_RATIO);

        if (msRemaining <= preValidateMs) {
          if (__DEV__) {
            const label = msRemaining <= 0
              ? `expired ${Math.abs(Math.round(msRemaining / 1000))}s ago`
              : `expiring in ${Math.round(msRemaining / 1000)}s (threshold ${Math.round(preValidateMs / 1000)}s)`;
            console.log(`🔍 [PRE-VALIDATE] Token ${label} — refreshing before request...`);
          }

          isRefreshing      = true;
          cfg._preValidated = true; // mark so the retry doesn't re-enter this block

          try {
            const { newToken, newRefreshToken } = await callRefreshEndpoint();
            applyNewTokens(newToken, newRefreshToken);
            startTokenRefreshCycle(newToken);
            if (__DEV__) console.log('✅ [PRE-VALIDATE] Token refreshed inline');
          } catch (err: any) {
            const isNetworkErr = !err?.response;
            if (!isNetworkErr) {
              // Auth failure — clear session, let the request proceed to get a 401
              // which will be handled by the response interceptor's logout path
              if (__DEV__) console.warn('⚠️ [PRE-VALIDATE] Inline refresh failed — proceeding to 401');
            }
            // Network error — proceed anyway; the response interceptor will queue it
          } finally {
            isRefreshing = false;
          }
        }
      }
    }
  }

  // ── 2. Attach headers ─────────────────────────────────────────────────────
  // Always delete first — ensures AxiosHeaders (Axios 1.x) picks up the new
  // value cleanly. Without this, a stale Authorization from a cloned config
  // can survive into the retry even after tokenManager is updated.
  cfg.headers.delete('Authorization');
  const token = tokenManager.getToken();
  if (token) {
    cfg.headers.set('Authorization', `Bearer ${token}`);
  }

  const tenantSlug = tokenManager.getTenantSlug();
  if (tenantSlug) {
    cfg.headers.set('X-Tenant-Slug', tenantSlug);
  }

  cfg.headers.set(
    'X-Request-ID',
    `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  );

  if (__DEV__) {
    const auth    = cfg.headers.get('Authorization') as string | null;
    const slug    = cfg.headers.get('X-Tenant-Slug') as string | null;
    const reqId   = cfg.headers.get('X-Request-ID') as string | null;
    const fullUrl = `${cfg.baseURL ?? ''}${cfg.url ?? ''}`;
    const method  = (cfg.method ?? 'GET').toUpperCase().padEnd(6);
    console.log(
      `📤 [${reqId?.slice(-6)}] ${method} ${fullUrl}\n` +
      `   Auth: ${auth ? '✅' : '❌ MISSING'} | Slug: ${slug ?? '❌ MISSING'}`
    );
  }

  return cfg;
});

// ─────────────────────────────────────────────────────────────────────────────
// Reactive 401 queue
// If multiple requests fail simultaneously, only ONE refresh call is made.
// All others are queued and retried/rejected together.
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;

// When the refresh fails due to network error, we stay in "refreshing" state
// so subsequent 401s join the queue instead of triggering new refresh attempts.
let isWaitingForConnectivity = false;

// resolve: () => void — the token is NOT passed to consumers.
// The request interceptor always re-reads from tokenManager, so passing the
// token here would be redundant and could carry a stale value.
let failedQueue: Array<{
  resolve: () => void;
  reject:  (error: ApiError) => void;
}> = [];

// Max queue size — prevents unbounded growth during long offline periods.
const MAX_QUEUE_SIZE = 20;

function drainQueue(error: ApiError | null): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
}

/**
 * Called by networkEvents when connectivity is restored.
 * Attempts a single token refresh then drains all queued 401 requests.
 */
export async function retryQueuedAuthRequests(): Promise<void> {
  if (!isWaitingForConnectivity) return;

  // If the queue is empty, just reset the flags — no refresh needed.
  // This can happen when connectivity is restored but all queued requests
  // were already resolved/rejected by another path (e.g. user navigated away).
  if (failedQueue.length === 0) {
    isWaitingForConnectivity = false;
    isRefreshing             = false;
    return;
  }

  if (__DEV__) {
    console.log(`🔄 [REFRESH] Connectivity restored — retrying refresh for ${failedQueue.length} queued request(s)`);
  }

  isWaitingForConnectivity = false;
  // isRefreshing stays true — we own the refresh

  try {
    const { newToken, newRefreshToken } = await callRefreshEndpoint();
    applyNewTokens(newToken, newRefreshToken);
    startTokenRefreshCycle(newToken);
    if (__DEV__) console.log('✅ [REFRESH] Token refreshed after connectivity restored');
    drainQueue(null);
  } catch (err: any) {
    const isNetworkErr = !err?.response;
    if (isNetworkErr) {
      // Still offline — go back to waiting
      isWaitingForConnectivity = true;
      if (__DEV__) console.warn('⚠️ [REFRESH] Still offline after connectivity event — staying queued');
      return;
    }
    // Auth error — session truly expired
    const sessionExpiredError: ApiError = {
      status:      HTTP_STATUS.UNAUTHORIZED,
      message:     'Session expired. Please log in again.',
      isRetryable: false,
    };
    drainQueue(sessionExpiredError);
    tokenManager.clear();
    stopTokenRefreshCycle();
    try { authEvents.logout(); } catch { }
  } finally {
    if (!isWaitingForConnectivity) {
      isRefreshing = false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response interceptor — reactive 401 fallback
// ─────────────────────────────────────────────────────────────────────────────

http.interceptors.response.use(
  (response) => {
    // Update clock skew estimate from every response's Date header
    updateClockSkew(response.headers['date'] as string | null ?? null);

    if (__DEV__) {
      const reqId  = response.config.headers?.['X-Request-ID'] as string | null;
      const method = (response.config.method ?? 'GET').toUpperCase().padEnd(6);
      const url    = response.config.url ?? '';
      console.log(`✅ [${reqId?.slice(-6)}] ${method} ${url} → ${response.status}`);
    }
    return response;
  },

  async (error: AxiosError) => {
    const originalConfig = error.config as RetryableRequestConfig | undefined;
    const status         = error.response?.status;
    const data           = error.response?.data as unknown;

    if (__DEV__) {
      // 401 on non-refresh endpoints = expected token expiry, will be retried silently
      // Only log as error for non-401 or for the refresh endpoint itself
      const isHandled401 =
        status === HTTP_STATUS.UNAUTHORIZED &&
        !originalConfig?.url?.includes('/auth/refresh') &&
        !originalConfig?._retried;

      if (!isHandled401) {
        console.error(
          `❌ [${originalConfig?.headers?.['X-Request-ID']}]`,
          `${status} ${originalConfig?.method?.toUpperCase()} ${originalConfig?.url}`,
          data ?? error.message,
        );
      }
      // For handled 401s, log quietly so the refresh flow is traceable
      if (isHandled401) {
        console.log(
          `🔄 [401] Token expired on ${originalConfig?.method?.toUpperCase()} ${originalConfig?.url} — refreshing...`,
        );
      }
    }

    // ── Reactive 401 handler ─────────────────────────────────────────────────
    // Guards:
    //  1. Must be a 401
    //  2. Must have a config to retry
    //  3. Must NOT already be a retried request (prevents infinite loop)
    //  4. Must NOT be the refresh endpoint itself
    if (
      status === HTTP_STATUS.UNAUTHORIZED &&
      originalConfig &&
      !originalConfig._retried &&
      !originalConfig.url?.includes('/auth/refresh')
    ) {
      // ── Case A: a refresh is already in flight — join the queue ────────────
      if (isRefreshing) {
        // Drop oldest entry if queue is full — prevents unbounded growth
        if (failedQueue.length >= MAX_QUEUE_SIZE) {
          const dropped = failedQueue.shift();
          dropped?.reject({ status: 0, message: 'Request dropped — queue full', isRetryable: false });
          if (__DEV__) console.warn('⚠️ [Queue] Max queue size reached — dropped oldest request');
        }
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Request interceptor re-reads token from tokenManager on retry
            originalConfig._retried = true;
            return http.request(originalConfig);
          })
          .catch((err: ApiError) => Promise.reject(err));
      }

      // ── Case B: we are the first 401 — trigger a refresh ───────────────────
      isRefreshing = true;
      originalConfig._retried = true;

      // Cancel proactive refresh — it may be racing with us using the same token
      stopTokenRefreshCycle();

      try {
        const storedRefreshToken = tokenManager.getRefreshToken();
        if (!storedRefreshToken) {
          throw new Error('No refresh token — cannot refresh');
        }

        const { newToken, newRefreshToken } = await callRefreshEndpoint();

        applyNewTokens(newToken, newRefreshToken);
        startTokenRefreshCycle(newToken);

        if (__DEV__) {
          const newExp = getTokenExp(newToken);
          const expiresIn = newExp ? Math.round((newExp * 1000 - Date.now()) / 60_000) : 0;
          console.log(`✅ [REFRESH] Token reactively refreshed. Expires in ${expiresIn}m`);
        }

        drainQueue(null);
        return http.request(originalConfig);

      } catch (refreshError: any) {
        const refreshStatus = refreshError?.response?.status;
        const isNetworkErr  = !refreshError?.response;

        if (__DEV__) {
          console.warn('🔄 [REFRESH] Reactive refresh failed:',
            refreshStatus ?? refreshError?.message,
            refreshError?.response?.data ?? ''
          );
        }

        if (isNetworkErr) {
          // Stay in "refreshing" state — subsequent 401s join the queue.
          // retryQueuedAuthRequests() will drain when connectivity returns.
          // Do NOT reset isRefreshing here — the finally block is skipped
          // by returning early, so we manually control the flag.
          isWaitingForConnectivity = true;
          const networkError: ApiError = {
            status:      0,
            message:     'Network error. Please check your connection.',
            isRetryable: false,
          };
          drainQueue(networkError);
          // isRefreshing intentionally stays true — see isWaitingForConnectivity
          return Promise.reject(networkError);
        }

        const sessionExpiredError: ApiError = {
          status:      HTTP_STATUS.UNAUTHORIZED,
          message:     'Session expired. Please log in again.',
          isRetryable: false,
        };

        drainQueue(sessionExpiredError);
        tokenManager.clear();
        stopTokenRefreshCycle();
        requestDeduplicator.clear(); // stale in-flight entries belong to expired session
        try { authEvents.logout(); } catch { }

        if (__DEV__) console.warn('🚪 Refresh failed — logging out');
        return Promise.reject(sessionExpiredError);

      } finally {
        // Only reset if we're NOT waiting for connectivity.
        // The network-error path returns early before finally runs — but
        // if it ever reaches here, guard against clearing the waiting state.
        if (!isWaitingForConnectivity) {
          isRefreshing = false;
        }
      }
    }

    // ── All other errors — normalise and forward ─────────────────────────────
    let message = 'An unexpected error occurred';
    if (typeof data === 'object' && data !== null) {
      const d = data as Record<string, unknown>;
      message = String(d.error ?? d.message ?? message);
    } else if (error.message) {
      message = error.message;
    }

    const isNetworkError = !error.response && (
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK'  ||
      error.message === 'Network Error'
    );

    // Fire global network error event — UI can show a dialog
    if (isNetworkError) {
      networkEvents.emit('Network error. Please check your connection.');

      // Enqueue the request for automatic retry when connectivity is restored
      if (originalConfig) {
        return networkEvents.enqueue(originalConfig);
      }
    }

    const isRetryable =
      !error.response ||
      status === HTTP_STATUS.REQUEST_TIMEOUT ||
      status === HTTP_STATUS.TOO_MANY_REQUESTS ||
      (status !== undefined && status >= 500 && status !== 501);

    const shouldShowDialog =
      !isNetworkError &&
      status !== HTTP_STATUS.UNAUTHORIZED &&
      status !== HTTP_STATUS.NOT_FOUND &&
      // 429 is retryable — don't show an error dialog, the retry will handle it
      status !== HTTP_STATUS.TOO_MANY_REQUESTS &&
      status !== undefined;

    if (shouldShowDialog) {
      // Map backend errorCode → UI reason via the shared ERROR_REASON_MAP in types.ts.
      // Normalize casing so 'associated_data', 'ASSOCIATED_DATA', etc. all resolve.
      const rawCode   = (data as Record<string, unknown>)?.errorCode as string | undefined;
      const errorCode = rawCode?.toUpperCase().replace(/-/g, '_');
      const reason    = errorCode ? ERROR_REASON_MAP[errorCode] : undefined;

      networkEvents.emitApiError(status!, message, data, reason);
    }

    return Promise.reject({
      status,
      message,
      details:     data,
      code:        error.code,
      isRetryable: status === HTTP_STATUS.UNAUTHORIZED ? false : isRetryable,
    } as ApiError);
  },
);

export default http;

// Register retry callback — httpClient re-executes queued requests when
// connectivity is restored. Done after all interceptors are set up.
networkEvents.setRetryCallback((config) => http.request(config));

// Register connectivity callback — when network is restored, retry any
// requests that were blocked waiting for a token refresh.
networkEvents.setConnectivityCallback(() => retryQueuedAuthRequests());

// Wire circuit breaker → authEvents so the UI can respond when the circuit opens.
// authStore registers the actual handler (navigate to login / show modal).
circuitBreaker.onSessionExpired(() => {
  // Clear in-flight deduplication entries — they belong to the expired session
  requestDeduplicator.clear();
  tokenManager.clear();
  stopTokenRefreshCycle();
  try {
    authEvents.sessionExpired();
  } catch (err) {
    if (__DEV__) console.error('⚠️ [CircuitBreaker] sessionExpired handler threw:', err);
  }
});
