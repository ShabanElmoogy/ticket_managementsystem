export type { ApiError } from './httpClient';
export { http } from './httpClient';
export { request } from './retryLogic';
export { api } from './apiClient';

import { api } from './apiClient';

/**
 * BaseApiService — all feature API classes extend this.
 * Uses the retry-enabled api client, matching web behaviour.
 */
export class BaseApiService {
  protected get    = api.get;
  protected post   = api.post;
  protected put    = api.put;
  protected patch  = api.patch;
  protected delete = api.delete;
}
