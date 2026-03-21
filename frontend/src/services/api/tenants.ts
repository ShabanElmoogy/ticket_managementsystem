import { api } from "./base";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
};

export const tenantsApi = {
  // Admin
  list: () => api.get<Tenant[]>("/tenants"),
  create: (payload: { name: string; slug?: string }) => api.post<Tenant>("/tenants", payload),

  // Public-ish
  getBySlug: (slug: string) => api.get<Tenant>(`/tenants/by-slug/${encodeURIComponent(slug)}`),
};
