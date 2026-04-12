/**
 * Public API client — typed convenience methods over the core request function.
 *
 * Usage:
 *   import { api } from './apiClient';
 *   const data = await api.get<User[]>('/users');
 */

import type { AxiosRequestConfig } from 'axios';
import { http } from './httpClient';
import { request } from './retryLogic';

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ url, method: 'GET', ...config }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: 'POST', data, ...config }),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: 'PUT', data, ...config }),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: 'PATCH', data, ...config }),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ url, method: 'DELETE', ...config }),

  /** Programmatically set the Authorization header (e.g. after login). */
  setAuthToken: (token?: string | null) => {
    if (!token) {
      delete (http.defaults.headers.common as Record<string, string>).Authorization;
      return;
    }
    (http.defaults.headers.common as Record<string, string>).Authorization = `Bearer ${token}`;
  },

  /** Remove the Authorization header. */
  clearAuthToken: () => {
    delete (http.defaults.headers.common as Record<string, string>).Authorization;
  },

  /** Expose the configured base URL. */
  getBaseUrl: () => http.defaults.baseURL ?? '',

  /** Escape hatch — direct access to the axios instance. */
  getHttpClient: () => http,
};
