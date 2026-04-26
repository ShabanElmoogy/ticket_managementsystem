import { API } from '@/src/constants/api';
import { BaseApiService } from '@/src/services/api/base';
import type { LoginData, LoginResponse } from '@/src/services/api/types';

export class AuthApiService extends BaseApiService {
  login = (data: LoginData) =>
    this.post<LoginResponse>(API.AUTH.LOGIN, data);

  loginWithTenant = (data: LoginData, tenantSlug: string) =>
    this.post<LoginResponse>(API.AUTH.LOGIN, data, {
      headers: { 'X-Tenant-Slug': tenantSlug },
    });

  devLogin = (email: string, tenantSlug?: string) =>
    this.post<LoginResponse>(API.AUTH.DEV_LOGIN, { email }, {
      headers: tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {},
    });
}

export const authApi = new AuthApiService();
