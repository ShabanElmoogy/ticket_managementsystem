import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { usePaginationStore } from '../../stores/paginationStore';

// ── Stale time constants ──────────────────────────────────────────────────────

/** SERVER mode: short stale time — each page is a distinct cache entry */
const SERVER_STALE_MS = 60  * 1000; // 1 minute
/** CLIENT mode: longer stale time — full dataset fetched once */
const CLIENT_STALE_MS = 30  * 1000; // 30 seconds

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page:        number;
    limit:       number;
    total:       number;
    totalPages:  number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface EntityDataReturn<T, CreateT> {
  entities: T[];
  loading:  boolean;
  /** Only populated in SERVER mode with pagination params */
  apiMeta:  PaginatedResponse<T>['pagination'] | null;
  create:   (data: CreateT) => Promise<T>;
  update:   (id: string | number, data: CreateT) => Promise<T>;
  remove:   (id: string | number) => Promise<void>;
  refetch:  () => void;
}

export interface EntityConfig<T, CreateT> {
  queryKey: readonly string[];
  api: {
    /** Called with { page, limit } in SERVER mode, { limit } in CLIENT mode */
    getAll:  (params?: Record<string, string>) => Promise<T[] | PaginatedResponse<T>>;
    create:  (data: CreateT) => Promise<T>;
    update:  (id: string, data: CreateT) => Promise<T>;
    delete:  (id: string) => Promise<unknown>;
  };
  /** Current page — passed from AdminCrudScreen in SERVER mode */
  page?:  number;
  /** Page size — passed from AdminCrudScreen in SERVER mode */
  limit?: number;
}

// ── Helper — unwrap array or paginated response ───────────────────────────────

function unwrap<T>(result: T[] | PaginatedResponse<T>): {
  entities: T[];
  meta:     PaginatedResponse<T>['pagination'] | null;
} {
  if (Array.isArray(result)) {
    return { entities: result, meta: null };
  }
  if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
    return { entities: result.data, meta: result.pagination };
  }
  return { entities: result as unknown as T[], meta: null };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEntityData<T, CreateT>(
  config: EntityConfig<T, CreateT>
): EntityDataReturn<T, CreateT> {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient     = useQueryClient();
  const paginationMode  = usePaginationStore((s) => s.paginationMode);
  const effectiveSize   = usePaginationStore((s) => s.getEffectivePageSize());
  const maxClientRecs   = usePaginationStore((s) => s.maxClientRecords);

  const page  = config.page  ?? 1;
  const limit = config.limit ?? effectiveSize;

  // In SERVER mode include page + limit in the query key so each page is cached separately.
  // In CLIENT mode fetch everything once (no page params in key).
  const queryKey = paginationMode === 'SERVER'
    ? [...config.queryKey, 'page', String(page), 'limit', String(limit)]
    : config.queryKey;

  const queryParams: Record<string, string> = paginationMode === 'SERVER'
    ? { page: String(page), limit: String(limit) }
    : { limit: String(maxClientRecs) };

  const { data: raw, isLoading: loading, refetch } = useQuery({
    queryKey,
    queryFn:  () => config.api.getAll(queryParams),
    enabled:  isAuthenticated,
    staleTime: paginationMode === 'SERVER' ? SERVER_STALE_MS : CLIENT_STALE_MS,
    // SERVER mode: don't show previous page while loading next
    // CLIENT mode: keep previous data visible during background refresh
    placeholderData: paginationMode === 'SERVER'
      ? undefined
      : (prev: T[] | PaginatedResponse<T> | undefined) => prev,
  });

  const { entities, meta: apiMeta } = raw
    ? unwrap<T>(raw as T[] | PaginatedResponse<T>)
    : { entities: [] as T[], meta: null };

  // ── Mutations — always invalidate the base key (clears all pages) ──────────

  const createMutation = useMutation({
    mutationFn: config.api.create,
    onSettled:  () => queryClient.invalidateQueries({ queryKey: config.queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateT }) =>
      config.api.update(id, data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: config.queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: config.api.delete,
    onSettled:  () => queryClient.invalidateQueries({ queryKey: config.queryKey }),
  });

  const create = useCallback(
    async (data: CreateT) => {
      if (!isAuthenticated) throw new Error('Cannot create: user is not authenticated');
      return createMutation.mutateAsync(data);
    },
    [isAuthenticated, createMutation]
  );

  const update = useCallback(
    async (id: string | number, data: CreateT) => {
      if (!isAuthenticated) throw new Error('Cannot update: user is not authenticated');
      return updateMutation.mutateAsync({ id: String(id), data });
    },
    [isAuthenticated, updateMutation]
  );

  const remove = useCallback(
    async (id: string | number) => {
      if (!isAuthenticated) throw new Error('Cannot delete: user is not authenticated');
      await deleteMutation.mutateAsync(String(id));
    },
    [isAuthenticated, deleteMutation]
  );

  return {
    entities,
    loading,
    apiMeta,
    create,
    update,
    remove,
    refetch,
  };
}
