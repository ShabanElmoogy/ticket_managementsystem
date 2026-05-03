import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';

/**
 * useAuxData — React Query wrapper for auxiliary/dropdown data.
 *
 * Designed for data that changes infrequently (users list, customers list,
 * applications list) and is used to populate selects and filters.
 *
 * Defaults:
 *   - staleTime: 5 minutes — data considered fresh for 5 min after fetch
 *   - gcTime:    10 minutes — cache entry kept for 10 min after last subscriber
 *   - refetchOnWindowFocus: false — no background refetch on app foreground
 *   - enabled: only fires when the user is authenticated
 *
 * @example
 *   const { data: users = [], isLoading } = useAuxData(
 *     ['users'],
 *     () => usersApi.getAll(),
 *   );
 */

const STALE_TIME_MS = 5  * 60 * 1000; //  5 minutes
const GC_TIME_MS    = 10 * 60 * 1000; // 10 minutes

export function useAuxData<T>(
  queryKey: QueryKey,
  queryFn:  () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<T>({
    staleTime:            STALE_TIME_MS,
    gcTime:               GC_TIME_MS,
    refetchOnWindowFocus: false,
    ...options,
    queryKey,
    queryFn,
    // Authentication guard — always applied, cannot be overridden by options
    enabled: isAuthenticated && (options?.enabled ?? true),
  });
}
