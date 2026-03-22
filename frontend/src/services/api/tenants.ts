import { api } from "./base";

export type Tenant = {
  id: string;
  name: string;
  slug: string;

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

  // Public-ish
  getBySlug: (slug: string) => api.get<Tenant>(`/tenants/by-slug/${encodeURIComponent(slug)}`),
};
