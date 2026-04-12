/**
 * Axios instance with request/response interceptors.
 *
 * Responsibilities:
 * - Single shared axios instance
 * - Inject Authorization + X-Tenant-Slug + X-Request-ID headers
 * - Normalize response errors into ApiError
 * - Handle 401 → token refresh → retry queued requests
 */

import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../../config/env';

// ============================================================================
// Types
// ============================================================================

export type ApiError = {
  status?: number;
  message: string;
  details?: unknown;
  code?: string;
  isRetryable?: boolean;
};

// ============================================================================
// Constants
// ============================================================================

export const REQUEST_TIMEOUT = 15_000; // 15 s

// ============================================================================
// Axios instance
// ============================================================================

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ============================================================================
// Request interceptor — auth + tenant + trace headers
// ============================================================================

http.interceptors.request.use(
  (config) => {
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
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// ============================================================================
// Token-refresh queue
// ============================================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: ApiError) => void;
}> = [];

function processQueue(error: ApiError | null, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
}

// ============================================================================
// Response interceptor — error normalization + token refresh
// ============================================================================

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
    const data = error.response?.data as unknown;

    // Extract human-readable message from response body
    let message = 'An unexpected error occurred';
    if (typeof data === 'object' && data) {
      const d = data as Record<string, unknown>;
      if ('error' in d) message = String(d.error);
      else if ('message' in d) message = String(d.message);
    } else if (error.message) {
      message = error.message;
    }

    // ── 401 handling: attempt token refresh ──────────────────────────────────
    if (status === 401 && error.config && !error.config.url?.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token available');

          const response = await http.post<{ token: string; refreshToken?: string }>(
            '/auth/refresh',
            { refreshToken },
          );

          const newToken = response.data.token;
          const newRefreshToken = response.data.refreshToken;

          localStorage.setItem('token', newToken);
          if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
          (http.defaults.headers.common as Record<string, string>).Authorization =
            `Bearer ${newToken}`;

          try {
            const { useAuthStore } = await import('../../stores/authStore');
            useAuthStore.getState().setToken(newToken);
            if (newRefreshToken) useAuthStore.getState().setRefreshToken(newRefreshToken);
          } catch (e) {
            console.error('Failed to update auth store:', e);
          }

          if (import.meta.env.DEV) console.log('✅ Token refreshed successfully');

          processQueue(null, newToken);

          if (error.config) {
            error.config.headers = error.config.headers ?? {};
            (error.config.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            return http.request(error.config);
          }
        } catch (refreshError) {
          const msg =
            refreshError instanceof Error ? refreshError.message : 'Token refresh failed';

          processQueue({ status: 401, message: msg, isRetryable: false }, null);

          try {
            const { useAuthStore } = await import('../../stores/authStore');
            useAuthStore.getState().logout();
          } catch (e) {
            console.error('Failed to logout:', e);
          }

          return Promise.reject({
            status: 401,
            message: 'Session expired. Please login again.',
            isRetryable: false,
          } satisfies ApiError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Queue the request until the ongoing refresh completes
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

    // ── Determine retryability ────────────────────────────────────────────────
    const isRetryable =
      !error.response ||
      error.response.status === 408 ||
      error.response.status === 429 ||
      (error.response.status >= 500 && error.response.status !== 501);

    const normalized: ApiError = {
      status,
      message,
      details: data,
      code: error.code,
      // 401 is never retried here — handled above via refresh
      isRetryable: status === 401 ? false : isRetryable,
    };

    return Promise.reject(normalized);
  },
);
