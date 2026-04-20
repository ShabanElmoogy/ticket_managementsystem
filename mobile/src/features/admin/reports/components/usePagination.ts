import { useState, useMemo, useEffect, useRef } from 'react';

export const PAGE_SIZE = 7;

export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);

  // Track previous length with a ref — only reset page when length actually changes
  // useEffect is safe here because setPage is stable and items.length is a primitive
  const prevLen = useRef(items.length);
  useEffect(() => {
    if (prevLen.current !== items.length) {
      prevLen.current = items.length;
      setPage(1);
    }
  }); // no dependency array — runs after every render but only calls setPage when length changed

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage   = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const next = () => goTo(safePage + 1);
  const prev = () => goTo(safePage - 1);

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
