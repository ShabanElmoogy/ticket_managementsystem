import { API, QUERY_KEYS } from '@/src/constants/api';
import { BaseApiService } from '@/src/services/api/base';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStart?: string | null;
  subscriptionEnd?: string | null;
  subscriptionSeats?: number;
  supportEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantStats {
  userCount: number;
  ticketCount: number;
}

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

type UpdateTenantPayload = Partial<CreateTenantPayload>;

export class TenantsApiService extends BaseApiService {
  listPublic = ()                                          => this.get<Pick<Tenant, 'id' | 'name' | 'slug'>[]>(API.TENANTS.PUBLIC);
  list       = (params?: Record<string, string>)           => this.get<Tenant[]>(API.TENANTS.LIST, { params });
  create     = (payload: CreateTenantPayload)             => this.post<Tenant>(API.TENANTS.LIST, payload);
  update     = (id: string, payload: UpdateTenantPayload) => this.patch<Tenant>(API.TENANTS.BY_ID(id), payload);
  remove     = (id: string)                               => this.delete<{ message: string }>(API.TENANTS.BY_ID(id));
  activate   = (id: string)                               => this.patch<Tenant>(API.TENANTS.ACTIVATE(id), {});
  deactivate = (id: string)                               => this.patch<Tenant>(API.TENANTS.DEACTIVATE(id), {});
  getStats   = (id: string)                               => this.get<TenantStats>(API.TENANTS.STATS(id));
  getBySlug  = (slug: string)                             => this.get<Tenant>(API.TENANTS.BY_SLUG(slug));
}

export const tenantsApi  = new TenantsApiService();
export const tenantsKeys = QUERY_KEYS.TENANTS;
