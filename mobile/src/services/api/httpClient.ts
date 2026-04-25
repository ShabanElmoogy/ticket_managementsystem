import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from './tokenManager';
import { networkEvents } from './networkEvents';
import { useAuthStore } from '../../stores/authStore';

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

// Extend config type to carry our retry flag
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
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

function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
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

  // How many ms until we should refresh (60 s before expiry, min 5 s)
  const msUntilRefresh = Math.max((exp * 1000 - Date.now()) - 60_000, 5_000);

  if (__DEV__) {
    console.log(`⏱ Proactive refresh in ${Math.round(msUntilRefresh / 1000)}s`);
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
      startTokenRefreshCycle(newToken); // reschedule for the new token
      if (__DEV__) {
        const exp = getTokenExp(newToken);
        const expiresIn = exp ? Math.round((exp - Date.now() / 1000) / 60) : 0;
        console.log(`✅ [REFRESH] Token proactively refreshed. New token expires in ${expiresIn}m`);
      }
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status;
      // If refresh token is expired/revoked (401), logout silently — this is expected
      if (status === 401) {
        if (__DEV__) console.log('🔑 [REFRESH] Refresh token expired/revoked — logging out');
        try { useAuthStore.getState().logout(); } catch { }
      } else {
        // Unexpected failure (network error etc.) — log as warning
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
// ─────────────────────────────────────────────────────────────────────────────

async function callRefreshEndpoint(): Promise<{
  newToken: string;
  newRefreshToken: string;
}> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  if (__DEV__) {
    console.log('🔄 [REFRESH] Calling /auth/refresh with token:', refreshToken.slice(0, 20) + '...');
  }

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

  return { newToken, newRefreshToken };
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

  // ⚠️ SYNCHRONOUS — update Zustand store immediately so the new refresh
  // token is persisted to AsyncStorage before the app can be killed.
  // Using dynamic import here caused a race condition where the old
  // refresh token was persisted if the app restarted before the async
  // import resolved.
  try {
    const store = useAuthStore.getState();
    store.setToken(newToken);
    if (newRefreshToken) store.setRefreshToken(newRefreshToken);
  } catch {
    // Store not yet initialized (very early in boot) — tokenManager is enough
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Request interceptor — attach token + request ID
// ─────────────────────────────────────────────────────────────────────────────

http.interceptors.request.use((config) => {
  // Always delete first — ensures AxiosHeaders (Axios 1.x) picks up the new
  // value cleanly. Without this, a stale Authorization from a cloned config
  // can survive into the retry even after tokenManager is updated.
  config.headers.delete('Authorization');
  const token = tokenManager.getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  const tenantSlug = tokenManager.getTenantSlug();
  if (tenantSlug) {
    config.headers.set('X-Tenant-Slug', tenantSlug);
  }

  config.headers.set(
    'X-Request-ID',
    `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  );

  if (__DEV__) {
    const auth    = config.headers.get('Authorization') as string | null;
    const slug    = config.headers.get('X-Tenant-Slug') as string | null;
    const reqId   = config.headers.get('X-Request-ID') as string | null;
    const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
    const method  = (config.method ?? 'GET').toUpperCase().padEnd(6);
    console.log(
      `📤 [${reqId?.slice(-6)}] ${method} ${fullUrl}\n` +
      `   Auth: ${auth ? '✅' : '❌ MISSING'} | Slug: ${slug ?? '❌ MISSING'}`
    );
  }

  return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// Reactive 401 queue
// If multiple requests fail simultaneously, only ONE refresh call is made.
// All others are queued and retried/rejected together.
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject:  (error: ApiError) => void;
}> = [];

function drainQueue(error: ApiError | null, token: string | null = null): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
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
        status === 401 &&
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
      status === 401 &&
      originalConfig &&
      !originalConfig._retried &&
      !originalConfig.url?.includes('/auth/refresh')
    ) {
      // ── Case A: a refresh is already in flight — join the queue ────────────
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((_newToken) => {
            // Don't touch headers here — the request interceptor will set
            // the correct Authorization from tokenManager on the retry.
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
          const exp = getTokenExp(newToken);
          const expiresIn = exp ? Math.round((exp - Date.now() / 1000) / 60) : 0;
          console.log(`✅ [REFRESH] Token reactively refreshed. Expires in ${expiresIn}m`);
        }

        drainQueue(null, newToken);
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
          // Network error — don't logout, let the user retry manually
          const networkError: ApiError = {
            status:      0,
            message:     'Network error. Please check your connection.',
            isRetryable: true,
          };
          drainQueue(networkError, null);
          isRefreshing = false;
          return Promise.reject(networkError);
        }

        // 401 or other server error — session is dead, logout
        const sessionExpiredError: ApiError = {
          status:      401,
          message:     'Session expired. Please log in again.',
          isRetryable: false,
        };

        drainQueue(sessionExpiredError, null);
        tokenManager.clear();
        stopTokenRefreshCycle();
        try { useAuthStore.getState().logout(); } catch { }

        if (__DEV__) console.warn('🚪 Refresh failed — logging out');
        return Promise.reject(sessionExpiredError);

      } finally {
        // ALWAYS reset — even if retry throws, future requests can refresh again
        isRefreshing = false;
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
      status === 408 ||
      status === 429 ||
      (status !== undefined && status >= 500 && status !== 501);

    // Fire global API error event for non-network, non-401 errors
    // 401 is handled by the refresh flow above — don't double-show it
    // 404 on detail fetches is expected (deleted resource) — skip silently
    const shouldShowDialog =
      !isNetworkError &&
      status !== 401 &&
      status !== 404 &&
      status !== undefined;

    if (shouldShowDialog) {
      networkEvents.emitApiError(status!, message, data);
    }

    return Promise.reject({
      status,
      message,
      details:     data,
      code:        error.code,
      isRetryable: status === 401 ? false : isRetryable,
    } as ApiError);
  },
);

export default http;

// Register retry callback — httpClient re-executes queued requests when
// connectivity is restored. Done after all interceptors are set up.
networkEvents.setRetryCallback((config) => http.request(config));
