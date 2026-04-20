import { useState, useMemo, useEffect } from 'react';

export const PAGE_SIZE = 7;

export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 whenever the dataset changes (search filter, report type switch)
  useEffect(() => { setPage(1); }, [items.length]);

  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const goTo   = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const next   = () => goTo(safePage + 1);
  const prev   = () => goTo(safePage - 1);

  return {
    paged,
    page: safePage,
    totalPages,
    totalItems: items.length,
    pageSize,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
    next,
    prev,
    goTo,
  };
}
