/**
 * AppDataTable — horizontally scrollable, sortable data table.
 * Also exports: useSorting, usePaginationSimple, ColDef, SortDir, SortState
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions, type ViewStyle } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { FlatList } = require('react-native') as { FlatList: any };
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc' | null;

export interface SortState {
  field: string | null;
  dir:   SortDir;
}

export interface ColDef<T> {
  field:        keyof T | string;
  headerName:   string;
  width?:       number;
  sortable?:    boolean;
  align?:       'left' | 'center' | 'right';
  renderCell?:  (row: T) => React.ReactNode;
  valueGetter?: (row: T) => string | number | null | undefined;
}

// ── useSorting ────────────────────────────────────────────────────────────────

export function useSorting<T>(items: T[]) {
  const [sort, setSort] = useState<SortState>({ field: null, dir: null });

  const toggle = useCallback((field: string) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc')   return { field, dir: 'desc' };
      return { field: null, dir: null };
    });
  }, []);

  const safeItems = Array.isArray(items) ? items : [];

  const sorted = useMemo(() => {
    if (!sort.field || !sort.dir) return safeItems;
    const f = sort.field as keyof T;
    return [...safeItems].sort((a, b) => {
      const av = a[f] ?? '';
      const bv = b[f] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [safeItems, sort]);

  return { sorted, sort, toggle };
}

// ── usePaginationSimple ───────────────────────────────────────────────────────

export function usePaginationSimple<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1);
  const prevLen = useRef(items.length);

  useEffect(() => {
    if (prevLen.current !== items.length) {
      prevLen.current = items.length;
      setPage(1);
    }
  }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage   = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const goTo = useCallback(
    (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages],
  );

  return {
    paged, page: safePage, totalPages, totalItems: items.length, pageSize,
    hasNext: safePage < totalPages, hasPrev: safePage > 1,
    next: () => goTo(safePage + 1), prev: () => goTo(safePage - 1), goTo,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AppDataTableProps<T extends { id: string }> {
  rows:          T[];
  columns:       ColDef<T>[];
  loading?:      boolean;
  emptyMessage?: string;
  onRowPress?:   (row: T) => void;
  style?:        ViewStyle;
  rowHeight?:    number;
  headerHeight?: number;
  sortField?:    string | null;
  sortDir?:      SortDir;
  onSortChange?: (field: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCellValue<T>(row: T, col: ColDef<T>): string {
  if (col.valueGetter) return String(col.valueGetter(row) ?? '');
  const val = (row as any)[col.field as string];
  return val == null ? '' : String(val);
}

function sortRows<T>(rows: T[], col: ColDef<T> | null, dir: SortDir): T[] {
  if (!col || !dir) return rows;
  return [...rows.filter(Boolean)].sort((a, b) => {
    const av = getCellValue(a, col).toLowerCase();
    const bv = getCellValue(b, col).toLowerCase();
    const n  = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? n : -n;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

function AppDataTable<T extends { id: string }>({
  rows, columns,
  loading = false, emptyMessage = 'No data',
  onRowPress, style,
  rowHeight = 52, headerHeight = 32,
  sortField: controlledSortField,
  sortDir:   controlledSortDir,
  onSortChange,
}: AppDataTableProps<T>) {
  const c = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();

  const safeRows = (Array.isArray(rows) ? rows : []).filter(Boolean) as T[];

  const [internalField, setInternalField] = useState<string | null>(null);
  const [internalDir,   setInternalDir]   = useState<SortDir>(null);
  const [internalCol,   setInternalCol]   = useState<ColDef<T> | null>(null);

  const isControlled = controlledSortField !== undefined;
  const sortField    = isControlled ? (controlledSortField ?? null) : internalField;
  const sortDir      = isControlled ? (controlledSortDir   ?? null) : internalDir;

  const handleSort = useCallback((col: ColDef<T>) => {
    if (isControlled) { onSortChange?.(String(col.field)); return; }
    const field = String(col.field);
    if (internalField !== field) {
      setInternalField(field); setInternalDir('asc'); setInternalCol(col);
    } else if (internalDir === 'asc') {
      setInternalDir('desc');
    } else {
      setInternalField(null); setInternalDir(null); setInternalCol(null);
    }
  }, [isControlled, onSortChange, internalField, internalDir]);

  const activeSortCol = isControlled
    ? (columns.find((col) => String(col.field) === sortField) ?? null)
    : internalCol;

  const sorted = sortRows(safeRows, activeSortCol, sortDir);

  const MIN_COL    = 90;
  const fixedTotal = columns.reduce((sum, col) => sum + (col.width ?? 0), 0);
  const freeCols   = columns.filter((col) => !col.width).length;
  const freeWidth  = freeCols > 0 ? Math.max(MIN_COL, Math.floor((screenWidth - fixedTotal - 2) / freeCols)) : MIN_COL;
  const tableWidth = fixedTotal + freeWidth * freeCols;
  const getWidth   = (col: ColDef<T>): number => col.width ?? freeWidth;

  return (
    <View style={[{ flex: 1, borderWidth: 1, borderColor: c.border.primary, borderRadius: Radius.md, overflow: 'hidden' }, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View style={{ width: tableWidth }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', minHeight: headerHeight, backgroundColor: c.surface.tertiary, borderBottomWidth: 2, borderBottomColor: c.border.primary }}>
            {columns.map((col) => {
              const w       = getWidth(col);
              const active  = sortField === String(col.field);
              const arrow   = active ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';
              const align   = col.align ?? 'left';
              return (
                <Pressable
                  key={String(col.field)}
                  onPress={() => col.sortable !== false && handleSort(col)}
                  accessibilityRole="button"
                  style={{ width: w, paddingHorizontal: 10, paddingVertical: 4, alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', justifyContent: 'center', borderRightWidth: 1, borderRightColor: c.border.primary, minHeight: 32 }}
                >
                  <Text numberOfLines={2} style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.3, color: active ? c.border.focus : c.text.secondary, textAlign: align }}>
                    {col.headerName}{arrow}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Body */}
          {loading && safeRows.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: c.text.muted, fontSize: FontSize.base }}>Loading...</Text>
            </View>
          ) : sorted.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: c.text.muted, fontSize: FontSize.base }}>{emptyMessage}</Text>
            </View>
          ) : (
            <FlatList
              data={sorted}
              keyExtractor={(item: T) => item.id}
              scrollEnabled={false}
              renderItem={({ item, index }: { item: any; index: number }) => (
                <Pressable
                  onPress={() => onRowPress?.(item)}
                  style={{ flexDirection: 'row', minHeight: rowHeight, backgroundColor: index % 2 === 0 ? c.surface.primary : c.surface.secondary, borderBottomWidth: 1, borderBottomColor: c.border.primary }}
                >
                  {columns.map((col) => {
                    const w         = getWidth(col);
                    const align     = col.align ?? 'left';
                    const isActions = col.field === '__actions__';
                    return (
                      <View
                        key={String(col.field)}
                        style={{ width: w, paddingHorizontal: isActions ? 4 : 12, paddingVertical: 7, justifyContent: 'center', alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', borderRightWidth: 1, borderRightColor: c.surface.tertiary, overflow: 'visible' }}
                      >
                        {col.renderCell
                          ? col.renderCell(item)
                          : <Text numberOfLines={2} style={{ fontSize: FontSize.base, color: c.text.primary }}>{getCellValue(item, col)}</Text>
                        }
                      </View>
                    );
                  })}
                </Pressable>
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default AppDataTable;
