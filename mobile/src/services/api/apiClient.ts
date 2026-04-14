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

  setAuthToken: (token?: string | null) => {
    if (!token) {
      delete (http.defaults.headers.common as Record<string, string>).Authorization;
      return;
    }
    (http.defaults.headers.common as Record<string, string>).Authorization = `Bearer ${token}`;
  },

  clearAuthToken: () => {
    delete (http.defaults.headers.common as Record<string, string>).Authorization;
  },

  getBaseUrl: () => http.defaults.baseURL ?? '',
};
