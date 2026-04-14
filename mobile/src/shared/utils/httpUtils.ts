import { AxiosError } from 'axios';
import type { ApiError } from '../../../src/services/api/httpClient';

/** Extract a human-readable message from any error shape */
export const getErrorMessage = (error: unknown): string => {
  // Normalized ApiError from our interceptor
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as ApiError).message);
  }
  if (error instanceof AxiosError) {
    if (error.response?.data) {
      const d = error.response.data as Record<string, unknown>;
      return String(d.error ?? d.message ?? `HTTP ${error.response.status}`);
    }
    if (error.request) return 'Network error — no response received';
    return error.message || 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'An unknown error occurred';
};

export const isNetworkError = (error: unknown): boolean =>
  error instanceof AxiosError && !error.response;

export const isHttpError = (error: unknown, statusCode: number): boolean =>
  error instanceof AxiosError && error.response?.status === statusCode;

export const isUnauthorizedError = (error: unknown): boolean => isHttpError(error, 401);
export const isForbiddenError    = (error: unknown): boolean => isHttpError(error, 403);
export const isNotFoundError     = (error: unknown): boolean => isHttpError(error, 404);

export const isServerError = (error: unknown): boolean =>
  error instanceof AxiosError &&
  error.response?.status !== undefined &&
  error.response.status >= 500;
