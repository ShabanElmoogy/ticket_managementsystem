import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { tokenManager } from '../../services/api/tokenManager';
import { usePaginationStore } from '../../stores/paginationStore';

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
  entities:    T[];
  loading:     boolean;
  /** Only populated in SERVER mode with pagination params */
  apiMeta:     PaginatedResponse<T>['pagination'] | null;
  create:  (data: CreateT) => Promise<T>;
  update:  (id: string | number, data: CreateT) => Promise<T>;
  remove:  (id: string | number) => Promise<void>;
  refetch: () => void;
}

export interface EntityConfig<T, CreateT> {
  queryKey: readonly string[] | (() => readonly string[]);
  api: {
    /** Called with { page, limit } in SERVER mode, empty object in CLIENT mode */
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
  meta: PaginatedResponse<T>['pagination'] | null;
} {
  if (Array.isArray(result)) return { entities: result, meta: null };
  if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data)) {
    return { entities: (result as PaginatedResponse<T>).data, meta: (result as PaginatedResponse<T>).pagination };
  }
  return { entities: result as unknown as T[], meta: null };
}

export function useEntityData<T, CreateT>(
  config: EntityConfig<T, CreateT>
): EntityDataReturn<T, CreateT> {
  const { token }      = useAuthStore();
  const queryClient    = useQueryClient();
  const paginationMode = usePaginationStore((s) => s.paginationMode);
  const effectiveSize  = usePaginationStore((s) => s.getEffectivePageSize());
  const maxClientRecs  = usePaginationStore((s) => s.maxClientRecords);

  const resolvedKey =
    typeof config.queryKey === 'function' ? config.queryKey() : config.queryKey;

  // In SERVER mode include page + limit in the query key so each page is cached separately.
  // In CLIENT mode fetch everything once (no page params).
  const page  = config.page  ?? 1;
  const limit = config.limit ?? effectiveSize;

  const queryKey = paginationMode === 'SERVER'
    ? [...resolvedKey, 'page', String(page), 'limit', String(limit)]
    : resolvedKey;

  const queryParams: Record<string, string> = paginationMode === 'SERVER'
    ? { page: String(page), limit: String(limit) }
    : { limit: String(maxClientRecs) };  // CLIENT: fetch all up to cap

  const { data: raw, isLoading: loading, refetch } = useQuery({
    queryKey,
    queryFn:   () => config.api.getAll(queryParams),
    enabled:   !!token && !!tokenManager.getToken(),
    staleTime: paginationMode === 'SERVER' ? 60 * 1000 : 30 * 1000,
    // SERVER mode: don't keep previous page data visible while loading next page
    placeholderData: paginationMode === 'SERVER' ? undefined : (prev: any) => prev,
  });

  const { entities, meta: apiMeta } = raw ? unwrap<T>(raw as any) : { entities: [] as T[], meta: null };

  // ── Mutations — always invalidate the base key (clears all pages) ──────────

  const createMutation = useMutation({
    mutationFn: config.api.create,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resolvedKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateT }) =>
      config.api.update(id, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resolvedKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: config.api.delete,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resolvedKey });
    },
  });

  const create = useCallback(
    async (data: CreateT) => {
      if (!token) throw new Error('No authentication token');
      return createMutation.mutateAsync(data);
    },
    [token, createMutation]
  );

  const update = useCallback(
    async (id: string | number, data: CreateT) => {
      if (!token) throw new Error('No authentication token');
      return updateMutation.mutateAsync({ id: String(id), data });
    },
    [token, updateMutation]
  );

  const remove = useCallback(
    async (id: string | number) => {
      if (!token) throw new Error('No authentication token');
      await deleteMutation.mutateAsync(String(id));
    },
    [token, deleteMutation]
  );

  return {
    entities,
    loading,
    apiMeta,
    create,
    update,
    remove,
    refetch: () => refetch(),
  };
}
