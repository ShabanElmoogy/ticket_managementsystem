import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────────────────────

export type ApiError = {
  status?: number;
  message: string;
  details?: unknown;
  code?: string;
  isRetryable?: boolean;
};

// ── Constants ──────────────────────────────────────────────────────────────

export const REQUEST_TIMEOUT = 15_000;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';

// ── Axios instance ─────────────────────────────────────────────────────────

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ────────────────────────────────────────────────────

http.interceptors.request.use(async (config) => {
  // Token — read from Zustand persisted storage key
  const stored = await AsyncStorage.getItem('auth-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const token: string | null = parsed?.state?.token ?? null;
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore parse errors
    }
  }

  // Tenant slug
  const tenantSlug = await AsyncStorage.getItem('tenantSlug');
  if (tenantSlug) {
    (config.headers as Record<string, string>)['X-Tenant-Slug'] = tenantSlug;
  }

  // Request trace ID
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  (config.headers as Record<string, string>)['X-Request-ID'] = requestId;

  return config;
});

// ── Token-refresh queue ────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: ApiError) => void;
}> = [];

function processQueue(error: ApiError | null, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });
  failedQueue = [];
}

// ── Response interceptor ───────────────────────────────────────────────────

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestId = error.config?.headers?.['X-Request-ID'];
    const status = error.response?.status;
    const data = error.response?.data as unknown;

    if (__DEV__) {
      console.error(
        `❌ [${requestId}] ${status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        data || error.message,
      );
    }

    // Extract human-readable message
    let message = 'An unexpected error occurred';
    if (typeof data === 'object' && data) {
      const d = data as Record<string, unknown>;
      if ('error' in d) message = String(d.error);
      else if ('message' in d) message = String(d.message);
    } else if (error.message) {
      message = error.message;
    }

    // ── 401: attempt token refresh ─────────────────────────────────────────
    if (status === 401 && error.config && !error.config.url?.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const stored = await AsyncStorage.getItem('auth-storage');
          const refreshToken: string | null = stored
            ? (JSON.parse(stored)?.state?.refreshToken ?? null)
            : null;

          if (!refreshToken) throw new Error('No refresh token available');

          const response = await http.post<{ token: string; refreshToken?: string }>(
            '/auth/refresh',
            { refreshToken },
          );

          const newToken = response.data.token;
          const newRefreshToken = response.data.refreshToken;

          // Update persisted auth store
          const { useAuthStore } = await import('../../stores/authStore');
          useAuthStore.getState().setToken(newToken);
          if (newRefreshToken) useAuthStore.getState().setRefreshToken(newRefreshToken);

          if (__DEV__) console.log('✅ Token refreshed successfully');

          processQueue(null, newToken);

          if (error.config) {
            (error.config.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            return http.request(error.config);
          }
        } catch (refreshError) {
          const msg = refreshError instanceof Error ? refreshError.message : 'Token refresh failed';
          processQueue({ status: 401, message: msg, isRetryable: false }, null);

          const { useAuthStore } = await import('../../stores/authStore');
          useAuthStore.getState().logout();

          return Promise.reject({
            status: 401,
            message: 'Session expired. Please login again.',
            isRetryable: false,
          } as ApiError);
        } finally {
          isRefreshing = false;
        }
      } else {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (error.config) {
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
    } as ApiError);
  },
);

export default http;
