import { useState, useMemo } from 'react';

export type SortDir = 'asc' | 'desc' | null;

export interface SortState {
  field: string | null;
  dir:   SortDir;
}

export function useSorting<T>(items: T[]) {
  const [sort, setSort] = useState<SortState>({ field: null, dir: null });

  const toggle = (field: string) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc')   return { field, dir: 'desc' };
      return { field: null, dir: null }; // third tap clears sort
    });
  };

  const sorted = useMemo(() => {
    if (!sort.field || !sort.dir) return items;
    const f = sort.field as keyof T;
    return [...items].sort((a, b) => {
      const av = a[f] ?? '';
      const bv = b[f] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [items, sort]);

  return { sorted, sort, toggle };
}
