/**
 * Axios instance with request/response interceptors.
 * Web-only — reads token from localStorage directly (set by authStore).
 * Mobile has its own httpClient using tokenManager.
 */

import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../../config/env';

export type ApiError = {
  status?: number;
  message: string;
  details?: unknown;
  code?: string;
  isRetryable?: boolean;
};

export const REQUEST_TIMEOUT = 15_000;

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Proactive token refresh ────────────────────────────────────────────────
// Refresh 60s before expiry so users never hit a 401 mid-session.

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function getTokenExp(token: string): number | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))?.exp ?? null;
  } catch { return null; }
}

async function doWebRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return;
  try {
    const res = await http.post<{ token: string; refreshToken?: string }>(
      '/auth/refresh', { refreshToken }
    );
    const newToken        = res.data.token;
    const newRefreshToken = res.data.refreshToken;
    localStorage.setItem('token', newToken);
    if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
    http.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    // Update Zustand store
    import('../../stores/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().setToken(newToken);
      if (newRefreshToken) useAuthStore.getState().setRefreshToken(newRefreshToken);
    }).catch(() => {});
    // Schedule next refresh
    const exp = getTokenExp(newToken);
    if (exp) scheduleWebRefresh(exp - Date.now() / 1000);
    if (import.meta.env.DEV) console.log('✅ Web token proactively refreshed');
  } catch {
    if (import.meta.env.DEV) console.warn('⚠️ Web proactive refresh failed');
  }
}

export function scheduleWebRefresh(expiresInSeconds: number) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const ms = Math.max((expiresInSeconds - 60) * 1000, 0);
  refreshTimer = setTimeout(() => doWebRefresh().catch(() => {}), ms);
  if (import.meta.env.DEV) console.log(`⏰ Web token refresh in ${Math.round(ms / 1000)}s`);
}

export function stopWebRefresh() {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
}

// ── Request interceptor ────────────────────────────────────────────────────

http.interceptors.request.use(
  (config) => {
    // Read directly from localStorage — set by authStore.login() / setToken()
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const skipTenant = sessionStorage.getItem('skipTenantHeader') === 'true';
    const tenantSlug = skipTenant ? null : localStorage.getItem('tenantSlug');
    if (tenantSlug) {
      (config.headers as Record<string, string>)['X-Tenant-Slug'] = tenantSlug;
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    (config.headers as Record<string, string>)['X-Request-ID'] = requestId;

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Token-refresh queue ────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject:  (error: ApiError) => void;
}> = [];

function processQueue(error: ApiError | null, token: string | null = null) {
  failedQueue.forEach((p) => { if (error) p.reject(error); else if (token) p.resolve(token); });
  failedQueue = [];
}

// ── Response interceptor ───────────────────────────────────────────────────

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestId = error.config?.headers?.['X-Request-ID'];
    if (import.meta.env.DEV) {
      console.error(
        `❌ [${requestId}] ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.data || error.message,
      );
    }

    const status = error.response?.status;
    const data   = error.response?.data as unknown;

    let message = 'An unexpected error occurred';
    if (typeof data === 'object' && data) {
      const d = data as Record<string, unknown>;
      if ('error' in d)        message = String(d.error);
      else if ('message' in d) message = String(d.message);
    } else if (error.message) {
      message = error.message;
    }

    // ── Reactive 401 fallback ──────────────────────────────────────────────
    if (status === 401 && error.config && !error.config.url?.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token available');

          const response = await http.post<{ token: string; refreshToken?: string }>(
            '/auth/refresh', { refreshToken }
          );

          const newToken        = response.data.token;
          const newRefreshToken = response.data.refreshToken;

          localStorage.setItem('token', newToken);
          if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
          http.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          // Restart proactive refresh
          const exp = getTokenExp(newToken);
          if (exp) scheduleWebRefresh(exp - Date.now() / 1000);

          import('../../stores/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().setToken(newToken);
            if (newRefreshToken) useAuthStore.getState().setRefreshToken(newRefreshToken);
          }).catch(() => {});

          if (import.meta.env.DEV) console.log('✅ Web token reactively refreshed');
          processQueue(null, newToken);

          if (error.config) {
            error.config.headers = error.config.headers ?? {};
            (error.config.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            return http.request(error.config);
          }
        } catch (refreshError) {
          const msg = refreshError instanceof Error ? refreshError.message : 'Token refresh failed';
          processQueue({ status: 401, message: msg, isRetryable: false }, null);
          stopWebRefresh();
          import('../../stores/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
          }).catch(() => {});
          return Promise.reject({
            status: 401,
            message: 'Session expired. Please login again.',
            isRetryable: false,
          } satisfies ApiError);
        } finally {
          isRefreshing = false;
        }
      } else {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (error.config) {
                error.config.headers = error.config.headers ?? {};
                (error.config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
                resolve(http.request(error.config));
              }
            },
            reject: (err: ApiError) => reject(err),
          });
        });
      }
    }

    const isRetryable =
      !error.response ||
      error.response.status === 408 ||
      error.response.status === 429 ||
      (error.response.status >= 500 && error.response.status !== 501);

    return Promise.reject({
      status,
      message,
      details: data,
      code: error.code,
      isRetryable: status === 401 ? false : isRetryable,
    } satisfies ApiError);
  },
);
