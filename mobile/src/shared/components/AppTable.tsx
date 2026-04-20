/**
 * AppTable — shared table primitives for virtualized, horizontally-scrollable tables.
 *
 * Exports:
 *   Primitives:  TH, STH, TD, TableRow, TableHeader, Badge
 *   Layout:      VirtualTable<T>
 *   Hooks:       useSorting, usePagination
 *   Constants:   W (column widths), STATUS_COLORS, PRIORITY_COLORS
 *   Types:       SortState, SortDir, ColDef, VirtualTableProps
 *
 * Usage pattern:
 *
 *   import { ScrollView } from 'react-native';
 *   import { VirtualTable, TableHeader, STH, TableRow, TD, Badge, W, useSorting } from '../../shared/components/AppTable';
 *
 *   const MyTable = ({ rows, isDark }) => {
 *     const { sorted, sort, toggle } = useSorting(rows);
 *     const renderHeader = useCallback(() => (
 *       <TableHeader isDark={isDark}>
 *         <STH width={W.name} isDark={isDark} field="name" sort={sort} onSort={toggle}>Name</STH>
 *       </TableHeader>
 *     ), [isDark, sort, toggle]);
 *     const renderRow = useCallback((r, i) => (
 *       <TableRow index={i} isDark={isDark}>
 *         <TD width={W.name} isDark={isDark}>{r.name}</TD>
 *       </TableRow>
 *     ), [isDark]);
 *     return (
 *       <ScrollView horizontal showsHorizontalScrollIndicator={false}>
 *         <VirtualTable rows={sorted} isDark={isDark} tableWidth={W.name}
 *           renderHeader={renderHeader} renderRow={renderRow} keyExtractor={r => r.id} />
 *       </ScrollView>
 *     );
 *   };
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, FlatList,
  type StyleProp, type ViewStyle,
} from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Color maps
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  OPEN:        '#f59e0b',
  IN_PROGRESS: '#8b5cf6',
  RESOLVED:    '#10b981',
  CLOSED:      '#64748b',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW:    '#10b981',
  MEDIUM: '#f59e0b',
  HIGH:   '#ef4444',
  URGENT: '#dc2626',
};

// ─────────────────────────────────────────────────────────────────────────────
// Column width constants
// ─────────────────────────────────────────────────────────────────────────────

export const W = {
  customer: 180,
  num:       72,
  pct:       72,
  status:    90,
  priority:  80,
  title:    200,
  name:     140,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Sort types
// ─────────────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc' | null;

export interface SortState {
  field: string | null;
  dir:   SortDir;
}

// ─────────────────────────────────────────────────────────────────────────────
// useSorting hook
// ─────────────────────────────────────────────────────────────────────────────

export function useSorting<T>(items: T[]) {
  const [sort, setSort] = useState<SortState>({ field: null, dir: null });

  const toggle = (field: string) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc')   return { field, dir: 'desc' };
      return { field: null, dir: null };
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

// ─────────────────────────────────────────────────────────────────────────────
// usePagination hook
// ─────────────────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 5;

export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const prevLen = useRef(items.length);
  useEffect(() => {
    if (prevLen.current !== items.length) {
      prevLen.current = items.length;
      setPage(1);
    }
  });

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage   = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return {
    paged,
    page: safePage,
    totalPages,
    totalItems: items.length,
    pageSize,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
    next: () => goTo(safePage + 1),
    prev: () => goTo(safePage - 1),
    goTo,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────────────

export const Badge: React.FC<{ label: string | number; color: string }> = ({ label, color }) => (
  <View style={{
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    backgroundColor: color + '22', borderWidth: 1, borderColor: color + '55',
    alignSelf: 'center',
  }}>
    <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// TH — static header cell
// ─────────────────────────────────────────────────────────────────────────────

export const TH: React.FC<{ children: string; width: number; isDark: boolean }> = ({ children, width, isDark }) => (
  <Text style={{
    width, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.4, color: isDark ? '#94a3b8' : '#64748b',
    textAlign: 'center', paddingVertical: 20, paddingHorizontal: 6,
  }}>
    {children}
  </Text>
);

// ─────────────────────────────────────────────────────────────────────────────
// STH — sortable header cell
// ─────────────────────────────────────────────────────────────────────────────

export const STH: React.FC<{
  children: string;
  width: number;
  isDark: boolean;
  field: string;
  sort: SortState;
  onSort: (field: string) => void;
}> = ({ children, width, isDark, field, sort, onSort }) => {
  const isActive = sort.field === field;
  const arrow    = isActive ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
  const color    = isActive ? '#3b82f6' : (isDark ? '#94a3b8' : '#64748b');

  return (
    <View style={{ width }}>
      <Pressable
        onPress={() => onSort(field)}
        style={({ pressed }) => ({
          paddingVertical: 16, paddingHorizontal: 6,
          backgroundColor: pressed
            ? (isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)')
            : 'transparent',
        })}
      >
        <Text style={{
          fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: 0.4, color, textAlign: 'center', paddingVertical: 7,
        }}>
          {children}{arrow}
        </Text>
      </Pressable>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TD — data cell
// ─────────────────────────────────────────────────────────────────────────────

export const TD: React.FC<{ children: React.ReactNode; width: number; isDark: boolean }> = ({ children, width, isDark }) => (
  <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 6 }}>
    {typeof children === 'string' || typeof children === 'number'
      ? <Text style={{ fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', textAlign: 'center' }} numberOfLines={1}>{children}</Text>
      : children}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// TableRow
// ─────────────────────────────────────────────────────────────────────────────

export const TableRow: React.FC<{
  index: number;
  isDark: boolean;
  children: React.ReactNode;
  onPress?: () => void;
}> = ({ index, isDark, children, onPress }) => {
  const base: StyleProp<ViewStyle> = {
    flexDirection: 'row',
    backgroundColor: index % 2 === 0
      ? 'transparent'
      : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  };

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        base,
        pressed && { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.07)' },
      ]}
    >
      {children}
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TableHeader
// ─────────────────────────────────────────────────────────────────────────────

export const TableHeader: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
  <View style={{
    flexDirection: 'row',
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    borderBottomWidth: 1.5,
    borderBottomColor: isDark ? '#334155' : '#e2e8f0',
  }}>
    {children}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// VirtualTable<T>
//
// Renders a sticky header + FlatList of rows inside a fixed-width container.
// Wrap in <ScrollView horizontal> for column scrolling.
// scrollEnabled=false — the outer FlatList/ScrollView owns vertical scrolling.
// ─────────────────────────────────────────────────────────────────────────────

export interface VirtualTableProps<T> {
  rows: T[];
  isDark: boolean;
  tableWidth: number;
  renderHeader: () => React.ReactElement;
  renderRow: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T) => string;
  /** Approximate row height in px — used for getItemLayout. Default 44. */
  rowHeight?: number;
}

export function VirtualTable<T>({
  rows, isDark, tableWidth, renderHeader, renderRow, keyExtractor, rowHeight = 44,
}: VirtualTableProps<T>) {
  return (
    <View style={{ flex: 1 }}>
      {/* Sticky header */}
      <View style={{ overflow: 'hidden' }}>
        <View style={{ minWidth: tableWidth }}>
          {renderHeader()}
        </View>
      </View>

      {/* Virtualized rows */}
      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => (
          <View style={{ minWidth: tableWidth }}>
            {renderRow(item, index)}
          </View>
        )}
        scrollEnabled={false}
        removeClippedSubviews={true}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        getItemLayout={(_data, index) => ({
          length: rowHeight,
          offset: rowHeight * index,
          index,
        })}
      />
    </View>
  );
}
