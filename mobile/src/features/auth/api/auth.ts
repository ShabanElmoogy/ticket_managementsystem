import { BaseApiService } from '../../../services/api/base';
import type { LoginData, LoginResponse } from '../../../services/api/types';

export class AuthApiService extends BaseApiService {
  login = (data: LoginData) =>
    this.post<LoginResponse>('/auth/login', data);

  loginWithTenant = (data: LoginData, tenantSlug: string) =>
    this.post<LoginResponse>('/auth/login', data, {
      headers: { 'X-Tenant-Slug': tenantSlug },
    });

  devLogin = (email: string, tenantSlug?: string) =>
    this.post<LoginResponse>('/auth/dev-login', { email }, {
      headers: tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {},
    });
}

export const authApi = new AuthApiService();
