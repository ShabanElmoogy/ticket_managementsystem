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
 *   const pg = usePagination(data, apiPagination);
 *
 *   // Render:
 *   {pg.rows.map(...)}
 *   <PaginationBar pg={pg} />
 *
 *   // Reset to page 1 when search changes:
 *   useEffect(() => pg.reset(), [searchQuery]);
 */

import { useState, useCallback } from 'react';
import { usePaginationStore } from '@/src/stores/paginationStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiPaginationMeta {
  page?:        number;
  totalPages?:  number;
  total?:       number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginationResult<T> {
  mode:        'SERVER' | 'CLIENT';
  rows:        T[];
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
  /** Query params to append to API calls (SERVER mode only, empty in CLIENT) */
  queryParams: Record<string, string>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePagination<T>(
  /** Full data array (CLIENT mode) or current page data (SERVER mode) */
  data: T[],
  /** Pagination metadata from API response — SERVER mode only */
  apiMeta?: ApiPaginationMeta | null,
): PaginationResult<T> {
  const mode        = usePaginationStore((s) => s.paginationMode);
  const maxPageSize = usePaginationStore((s) => s.maxPageSize);
  const setUserSize = usePaginationStore((s) => s.setUserPageSize);
  const effectiveSize = usePaginationStore((s) => s.getEffectivePageSize());

  const [page,     setPage]         = useState(1);
  const [pageSize, setPageSizeState] = useState(effectiveSize);

  const setPageSize = useCallback((n: number) => {
    const clamped = Math.min(n, maxPageSize);
    setUserSize(clamped);
    setPageSizeState(clamped);
    setPage(1);
  }, [maxPageSize, setUserSize]);

  const reset = useCallback(() => setPage(1), []);

  // ── CLIENT mode ─────────────────────────────────────────────────────────────
  if (mode === 'CLIENT') {
    const safeData   = Array.isArray(data) ? data : [];
    const total      = safeData.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage   = Math.min(page, totalPages);
    const rows       = safeData.slice((safePage - 1) * pageSize, safePage * pageSize);

    return {
      mode:        'CLIENT',
      rows,
      page:        safePage,
      pageSize,
      totalPages,
      total,
      hasNext:     safePage < totalPages,
      hasPrev:     safePage > 1,
      next:        () => setPage((p) => Math.min(p + 1, totalPages)),
      prev:        () => setPage((p) => Math.max(p - 1, 1)),
      goTo:        (p) => setPage(Math.max(1, Math.min(p, totalPages))),
      setPageSize,
      reset,
      queryParams: {},
    };
  }

  // ── SERVER mode ─────────────────────────────────────────────────────────────
  const total      = apiMeta?.total      ?? data.length;
  const totalPages = apiMeta?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  const hasNext    = apiMeta?.hasNextPage ?? page < totalPages;
  const hasPrev    = apiMeta?.hasPrevPage ?? page > 1;

  return {
    mode:        'SERVER',
    rows:        data,
    page,
    pageSize,
    totalPages,
    total,
    hasNext,
    hasPrev,
    next:        () => setPage((p) => (hasNext ? p + 1 : p)),
    prev:        () => setPage((p) => (hasPrev ? p - 1 : p)),
    goTo:        (p) => setPage(Math.max(1, Math.min(p, totalPages))),
    setPageSize,
    reset,
    queryParams: { page: String(page), limit: String(pageSize) },
  };
}
