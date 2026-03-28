import { api } from "../../../../services/api/base";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  adminEmail?: string | null;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionSeats?: number;
  supportEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _stats?: TenantStats;
};

export type TenantStats = {
  userCount: number;
  ticketCount: number;
};

export const tenantsApi = {
  // Public — no auth required
  listPublic: () => api.get<Pick<Tenant, 'id' | 'name' | 'slug'>[]>("/tenants/public"),

  // Admin
  list: () => api.get<Tenant[]>("/tenants"),
  create: (payload: {
    name: string;
    slug?: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    subscriptionStart?: string;
    subscriptionEnd?: string;
    subscriptionSeats?: number;
    supportEmail?: string | null;
  }) => api.post<Tenant>("/tenants", payload),

  update: (
    id: string,
    payload: Partial<{
      name: string;
      slug: string;
      subscriptionPlan: string;
      subscriptionStatus: string;
      subscriptionStart: string | null;
      subscriptionEnd: string | null;
      subscriptionSeats: number;
      supportEmail: string | null;
    }>
  ) => api.patch<Tenant>(`/tenants/${encodeURIComponent(id)}`, payload),

  delete: (id: string) => api.delete<{ message: string }>(`/tenants/${encodeURIComponent(id)}`),

  deactivate: (id: string) => api.patch<Tenant>(`/tenants/${encodeURIComponent(id)}/deactivate`, {}),

  activate: (id: string) => api.patch<Tenant>(`/tenants/${encodeURIComponent(id)}/activate`, {}),

  getStats: (id: string) => api.get<TenantStats>(`/tenants/${encodeURIComponent(id)}/stats`),

  // Public-ish
  getBySlug: (slug: string) => api.get<Tenant>(`/tenants/by-slug/${encodeURIComponent(slug)}`),
};
