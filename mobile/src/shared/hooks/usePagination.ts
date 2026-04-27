/**
 * usePagination — mode-aware pagination hook.
 *
 * SERVER mode:
 *   - Sends ?page=X&limit=Y to the API
 *   - Renders server-returned pages
 *   - totalPages comes from API response
 *
 * CLIENT mode:
 *   - Fetches all data once (up to maxClientRecords)
 *   - Slices locally for display
 *   - Fast page switching, no extra network calls
 *
 * Usage:
 *   const pg = usePagination(data, isLoading, apiPagination);
 *
 *   // In your query:
 *   const params = pg.mode === 'SERVER'
 *     ? { page: pg.page, limit: pg.pageSize }
 *     : {};  // CLIENT: no params, fetch all
 *
 *   // Render:
 *   {pg.rows.map(...)}
 *   <PaginationBar pg={pg} />
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePaginationStore } from '@/src/stores/paginationStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiPaginationMeta {
  page?:        number;
  totalPages?:  number;
  total?:       number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  mode?:        'CLIENT' | 'SERVER';
}

export interface PaginationResult<T> {
  mode:        'SERVER' | 'CLIENT';
  rows:        T[];           // current page rows (sliced for CLIENT, direct for SERVER)
  page:        number;
  pageSize:    number;
  totalPages:  number;
  total:       number;
  hasNext:     boolean;
  hasPrev:     boolean;
  next:        () => void;
  prev:        () => void;
  goTo:        (p: number) => void;
  setPageSize: (n: number) => void;
  reset:       () => void;
  /** Query params to append to API calls (SERVER mode only) */
  queryParams: Record<string, string>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePagination<T>(
  /** Full data array (CLIENT mode) or current page data (SERVER mode) */
  data: T[],
  isLoading: boolean,
  /** Pagination metadata from API response (SERVER mode) */
  apiMeta?: ApiPaginationMeta | null,
): PaginationResult<T> {
  const store      = usePaginationStore();
  const mode       = store.paginationMode;
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSizeState] = useState(() => store.getEffectivePageSize());

  // Reset to page 1 when data changes (e.g. search/filter applied)
  useEffect(() => {
    setPage(1);
  }, [isLoading]);

  const setPageSize = useCallback((n: number) => {
    const clamped = Math.min(n, store.maxPageSize);
    store.setUserPageSize(clamped);
    setPageSizeState(clamped);
    setPage(1); // reset on page size change
  }, [store]);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  // ── CLIENT mode ─────────────────────────────────────────────────────────────
  if (mode === 'CLIENT') {
    const total      = data.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage   = Math.min(page, totalPages);
    const rows       = data.slice((safePage - 1) * pageSize, safePage * pageSize);

    return {
      mode:       'CLIENT',
      rows,
      page:       safePage,
      pageSize,
      totalPages,
      total,
      hasNext:    safePage < totalPages,
      hasPrev:    safePage > 1,
      next:       () => setPage((p) => Math.min(p + 1, totalPages)),
      prev:       () => setPage((p) => Math.max(p - 1, 1)),
      goTo:       (p) => setPage(Math.max(1, Math.min(p, totalPages))),
      setPageSize,
      reset,
      queryParams: {},  // CLIENT mode: no server params
    };
  }

  // ── SERVER mode ─────────────────────────────────────────────────────────────
  const total      = apiMeta?.total      ?? data.length;
  const totalPages = apiMeta?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  const hasNext    = apiMeta?.hasNextPage ?? page < totalPages;
  const hasPrev    = apiMeta?.hasPrevPage ?? page > 1;

  return {
    mode:       'SERVER',
    rows:       data,   // server already sliced
    page,
    pageSize,
    totalPages,
    total,
    hasNext,
    hasPrev,
    next:       () => setPage((p) => (hasNext ? p + 1 : p)),
    prev:       () => setPage((p) => (hasPrev ? p - 1 : p)),
    goTo:       (p) => setPage(Math.max(1, Math.min(p, totalPages))),
    setPageSize,
    reset,
    queryParams: { page: String(page), limit: String(pageSize) },
  };
}
