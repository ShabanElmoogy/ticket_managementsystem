import { BaseApiService } from '../../../../services/api/base';
import type { Tenant, TenantStats } from '../types/types';

interface CreateTenantPayload {
  name: string;
  slug?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionSeats?: number;
  supportEmail?: string | null;
}

type UpdateTenantPayload = Partial<{
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  subscriptionSeats: number;
  supportEmail: string | null;
}>;

export class TenantsApiService extends BaseApiService {
  listPublic = () =>
    this.get<Pick<Tenant, 'id' | 'name' | 'slug'>[]>('/tenants/public');

  list     = ()                                    => this.get<Tenant[]>('/tenants');
  create   = (payload: CreateTenantPayload)        => this.post<Tenant>('/tenants', payload);
  update   = (id: string, payload: UpdateTenantPayload) =>
    this.patch<Tenant>(`/tenants/${encodeURIComponent(id)}`, payload);
  delete   = (id: string)                          => this.delete<{ message: string }>(`/tenants/${encodeURIComponent(id)}`);
  activate = (id: string)                          => this.patch<Tenant>(`/tenants/${encodeURIComponent(id)}/activate`, {});
  deactivate = (id: string)                        => this.patch<Tenant>(`/tenants/${encodeURIComponent(id)}/deactivate`, {});
  getStats = (id: string)                          => this.get<TenantStats>(`/tenants/${encodeURIComponent(id)}/stats`);
  getBySlug = (slug: string)                       => this.get<Tenant>(`/tenants/by-slug/${encodeURIComponent(slug)}`);
}

export const tenantsApi = new TenantsApiService();
