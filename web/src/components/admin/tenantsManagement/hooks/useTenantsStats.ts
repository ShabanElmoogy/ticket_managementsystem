import { useQueries } from '@tanstack/react-query';
import { tenantsApi } from '../api/tenants';
import type { Tenant, TenantStats } from '../types/types';

/**
 * Fetches stats for all tenants in parallel using React Query.
 * Returns a map of tenantId → TenantStats.
 */
export function useTenantsStats(tenants: Tenant[]): Record<string, TenantStats> {
  const results = useQueries({
    queries: tenants.map((t) => ({
      queryKey: ['tenant-stats', t.id],
      queryFn: () => tenantsApi.getStats(t.id),
      staleTime: 60_000,
    })),
  });

  return tenants.reduce<Record<string, TenantStats>>((acc, t, i) => {
    const data = results[i]?.data;
    if (data) acc[t.id] = data;
    return acc;
  }, {});
}
