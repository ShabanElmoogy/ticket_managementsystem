import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';

/**
 * Same as web/src/shared/hooks/useAuxData.ts
 * For dropdown/auxiliary data — cached 5 minutes, no refetch on window focus.
 */
export function useAuxData<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean }
) {
  const token = useAuthStore((s) => s.token);

  return useQuery<T>({
    queryKey,
    queryFn,
    enabled: !!token && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
