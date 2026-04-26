import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from './tokenManager';
import { networkEvents } from './networkEvents';
import { authEvents } from './authEvents';
import { circuitBreaker } from './circuitBreaker';
import { requestDeduplicator } from './requestDeduplicator';
import { HTTP_STATUS } from '@/src/constants/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ApiError = {
  status?: number;
  message: string;
  details?: unknown;
  code?: string;
  isRetryable?: boolean;
};

// Extend config type to carry our retry flags
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?:          boolean; // prevents infinite 401 retry loop
  _preValidated?:     boolean; // marks requests that already went through pre-validation
}

// ─────────────────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────────────────

export const REQUEST_TIMEOUT = 30_000; // 30s — mobile networks are slower

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api/v1';

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
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decode a JWT exp claim safely.
 * JWT uses base64url (RFC 4648 §5) which replaces + with - and / with _.
 * Standard atob() only handles base64 — must normalize before decoding.
 */
function getTokenExp(token: string): number | null {
  try {
    const base64url = token.split('.')[1];
    if (!base64url) return null;
    // Normalize base64url → base64, pad to multiple of 4
    const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(base64url.length / 4) * 4, '=');
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Proactive refresh cycle
// Schedules a refresh 60 s before the token expires so the interceptor
// almost never needs to fire reactively.
// ─────────────────────────────────────────────────────────────────────────────

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function startTokenRefreshCycle(token: string): void {
  stopTokenRefreshCycle();

  const exp = getTokenExp(token);
  if (!exp) return;

  // If the token is already expired (or expires within 70s), don't schedule —
  // the reactive 401 interceptor will handle it on the next request.
  // 70s = 60s refresh-before-expiry window + 10s safety margin.
  // Tokens with < 70s left would schedule at Math.max(x - 60_000, 5_000) = 5s,
  // causing a tight loop if the server keeps issuing short-lived tokens.
  const msUntilExpiry = exp * 1000 - Date.now();
  if (msUntilExpiry <= 70_000) {
    if (__DEV__) console.warn(
      `⚠️ [REFRESH] Token expiring too soon for proactive cycle — skipping` +
      ` (expires in ${Math.round(msUntilExpiry / 1000)}s, need >70s)`
    );
    return;
  }

  // Schedule refresh 60s before expiry — always at least 10s from now
  const msUntilRefresh = msUntilExpiry - 60_000;

  if (__DEV__) {
    const expiresAt = new Date(exp * 1000).toISOString();
    console.log(
      `⏱ Proactive refresh in ${Math.round(msUntilRefresh / 1000)}s` +
      ` (token expires at ${expiresAt}, ${Math.round(msUntilExpiry / 60_000)}m from now)`
    );
  }

  refreshTimer = setTimeout(async () => {
    // Skip if a reactive refresh is already in flight
    if (isRefreshing) {
      if (__DEV__) console.log('⏭ [REFRESH] Proactive skipped — reactive refresh in progress');
      return;
    }
    try {
      if (__DEV__) console.log('🔄 [REFRESH] Starting proactive token refresh...');
      const { newToken, newRefreshToken } = await callRefreshEndpoint();
      applyNewTokens(newToken, newRefreshToken);

      if (__DEV__) {
        const newExp = getTokenExp(newToken);
        const msLeft = newExp ? newExp * 1000 - Date.now() : 0;
        const expiresAt = newExp ? new Date(newExp * 1000).toISOString() : 'unknown';
        console.log(
          `✅ [REFRESH] Token proactively refreshed.\n` +
          `   Expires at: ${expiresAt}\n` +
          `   Expires in: ${Math.round(msLeft / 60_000)}m (${Math.round(msLeft / 1000)}s)`
        );
      }

      // Only reschedule if the new token is actually valid
      const newExp = getTokenExp(newToken);
      if (newExp && (newExp * 1000 - Date.now()) > 10_000) {
        startTokenRefreshCycle(newToken);
      } else {
        if (__DEV__) console.warn('⚠️ [REFRESH] Server returned an already-expired token — stopping refresh cycle');
        stopTokenRefreshCycle();
        try { authEvents.logout(); } catch { }
      }
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        if (__DEV__) console.log('🔑 [REFRESH] Refresh token expired/revoked — logging out');
        try { authEvents.logout(); } catch { }
      } else {
        if (__DEV__) {
          console.warn('⚠️ [REFRESH] Proactive refresh failed:', err?.message ?? err);
        }
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
// ─────────────────────────────────────────────────────────────────────────────

async function callRefreshEndpoint(): Promise<{
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

  try {
    const response = await refreshClient.post<{
      token: string;
      refreshToken?: string;
    }>('/auth/refresh', { refreshToken });

    const newToken        = response.data.token;
    const newRefreshToken = response.data.refreshToken ?? refreshToken;

    if (!newToken) throw new Error('Refresh response missing token');
    if (!newRefreshToken) throw new Error('Refresh response missing refreshToken');

    if (__DEV__) {
      const rotated = response.data.refreshToken && response.data.refreshToken !== refreshToken;
      console.log(`🔑 [REFRESH] Token refreshed. Refresh token ${rotated ? 'rotated ✅' : 'unchanged'}`);
    }

    // Success — reset circuit breaker failure counter
    circuitBreaker.recordSuccess();

    return { newToken, newRefreshToken };

  } catch (err: any) {
    const isNetworkErr = !err?.response;
    // Only count non-network errors as circuit breaker failures
    circuitBreaker.recordFailure(isNetworkErr);
    throw err;
  }
}

/**
 * Updates tokenManager synchronously AND Zustand store synchronously.
 * Both must happen before any retry fires — the request interceptor reads
 * from tokenManager, and Zustand persist writes to AsyncStorage immediately.
 */
function applyNewTokens(newToken: string, newRefreshToken: string): void {
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
  // Check expiry BEFORE sending. If the token is expired (or within 10s of
  // expiry) and no refresh is in flight, trigger one now. This eliminates
  // the 401 round-trip on the first request after a long background period.
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
      const exp         = getTokenExp(token);
      const msRemaining = exp ? exp * 1000 - Date.now() : 0;

      if (msRemaining <= 10_000) {
        if (__DEV__) console.log('🔍 [PRE-VALIDATE] Token expired — refreshing before request...');

        isRefreshing    = true;
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
  if (!isWaitingForConnectivity || failedQueue.length === 0) return;

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
      networkEvents.emitApiError(status!, message, data);
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
  try { authEvents.sessionExpired(); } catch { }
});
