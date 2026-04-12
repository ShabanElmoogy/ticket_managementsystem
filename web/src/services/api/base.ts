/**
 * @file base.ts
 *
 * Barrel re-export — keeps all existing import paths working.
 *
 * Internal structure:
 *   httpClient.ts  — axios instance, interceptors, token refresh
 *   retryLogic.ts  — exponential-backoff retry wrapper
 *   apiClient.ts   — typed api.get / post / put / patch / delete helpers
 *
 * Prefer importing directly from the specific module in new code:
 *   import { api }            from './apiClient';
 *   import { http, ApiError } from './httpClient';
 *   import { request }        from './retryLogic';
 */

export type { ApiError } from './httpClient';
export { http } from './httpClient';
export { request } from './retryLogic';
export { api } from './apiClient';
export type { AxiosRequestConfig } from 'axios';

// ============================================================================
// BaseApiService
// ============================================================================

import { api } from './apiClient';
import { http } from './httpClient';

/**
 * Base class for domain-specific API services.
 * Extend this to get typed HTTP helpers without importing `api` directly.
 */
export class BaseApiService {
  protected get = api.get;
  protected post = api.post;
  protected put = api.put;
  protected patch = api.patch;
  protected delete = api.delete;
  protected getBaseUrl = api.getBaseUrl;
  protected getHttpClient = () => http;
}
