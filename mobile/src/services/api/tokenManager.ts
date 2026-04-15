/**
 * tokenManager — plain module-level variables.
 *
 * No imports. No circular deps. No async.
 * authStore calls set* on every token change.
 * httpClient calls get* synchronously in the request interceptor.
 */

let _token: string | null = null;
let _refreshToken: string | null = null;
let _tenantSlug: string | null = null;

export const tokenManager = {
  setToken:        (t: string | null) => { _token = t; },
  setRefreshToken: (t: string | null) => { _refreshToken = t; },
  setTenantSlug:   (s: string | null) => { _tenantSlug = s; },
  getToken:        () => _token,
  getRefreshToken: () => _refreshToken,
  getTenantSlug:   () => _tenantSlug,
  clear:           () => { _token = null; _refreshToken = null; _tenantSlug = null; },
};
