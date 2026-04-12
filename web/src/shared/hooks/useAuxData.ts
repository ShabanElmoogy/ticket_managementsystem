import { useQuery } from '@tanstack/react-query';

/**
 * Thin wrapper around useQuery for auxiliary/dropdown data.
 * - 5-minute stale time so the same data isn't re-fetched on every dialog open
 * - `enabled` defaults to true; pass false to defer fetching
 */
export function useAuxData<T>(
  queryKey: readonly unknown[],
  fetcher: () => Promise<T>,
  enabled = true,
) {
  return useQuery<T>({
    queryKey,
    queryFn: fetcher,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
