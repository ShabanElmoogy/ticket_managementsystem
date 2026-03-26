import { api } from "../../../../services/api/base";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  adminEmail?: string | null;

  // Subscription
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionSeats?: number;

  createdAt?: string;
  updatedAt?: string;
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
    }>
  ) => api.patch<Tenant>(`/tenants/${encodeURIComponent(id)}`, payload),

  delete: (id: string) => api.delete<{ message: string }>(`/tenants/${encodeURIComponent(id)}`),

  // Public-ish
  getBySlug: (slug: string) => api.get<Tenant>(`/tenants/by-slug/${encodeURIComponent(slug)}`),
};
