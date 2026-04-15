import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, FlatList,
  type StyleProp, type ViewStyle, type TextStyle,
} from 'react-native';
import { useUiStore } from '../../stores/uiStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc' | null;

export interface ColDef<T> {
  field: keyof T | string;
  headerName: string;
  width?: number;          // fixed px width (default 120)
  flex?: number;           // flex weight (overrides width)
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  renderCell?: (row: T) => React.ReactNode;
  valueGetter?: (row: T) => string | number | null | undefined;
}

export interface AppDataTableProps<T extends { id: string }> {
  rows: T[];
  columns: ColDef<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowPress?: (row: T) => void;
  style?: StyleProp<ViewStyle>;
  rowHeight?: number;
  headerHeight?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCellValue<T>(row: T, col: ColDef<T>): string {
  if (col.valueGetter) return String(col.valueGetter(row) ?? '');
  const val = (row as any)[col.field as string];
  return val == null ? '' : String(val);
}

function sortRows<T>(rows: T[], col: ColDef<T> | null, dir: SortDir): T[] {
  if (!col || !dir) return rows;
  return [...rows].sort((a, b) => {
    const av = getCellValue(a, col).toLowerCase();
    const bv = getCellValue(b, col).toLowerCase();
    const n  = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? n : -n;
  });
}

// ── Header cell ───────────────────────────────────────────────────────────────

const HeaderCell = <T,>({
  col, sortField, sortDir, onSort, isDark,
}: {
  col: ColDef<T>;
  sortField: string | null;
  sortDir: SortDir;
  onSort: (col: ColDef<T>) => void;
  isDark: boolean;
}) => {
  const isActive = sortField === String(col.field);
  const arrow    = isActive ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <Pressable
      onPress={() => col.sortable !== false && onSort(col)}
      style={{
        width: col.flex ? undefined : (col.width ?? 120),
        flex: col.flex,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
        borderRightWidth: 1,
        borderRightColor: isDark ? '#334155' : '#e5e7eb',
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: isActive ? '#3b82f6' : isDark ? '#94a3b8' : '#6b7280',
        }}
      >
        {col.headerName}{arrow}
      </Text>
    </Pressable>
  );
};

// ── Data cell ─────────────────────────────────────────────────────────────────

const DataCell = <T,>({
  col, row, isDark,
}: {
  col: ColDef<T>;
  row: T;
  isDark: boolean;
}) => (
  <View
    style={{
      width: col.flex ? undefined : (col.width ?? 120),
      flex: col.flex,
      paddingHorizontal: 12,
      paddingVertical: 10,
      justifyContent: 'center',
      alignItems: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
      borderRightWidth: 1,
      borderRightColor: isDark ? '#1e293b' : '#f1f5f9',
    }}
  >
    {col.renderCell ? (
      col.renderCell(row)
    ) : (
      <Text
        numberOfLines={2}
        style={{ fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b' }}
      >
        {getCellValue(row, col)}
      </Text>
    )}
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────

function AppDataTable<T extends { id: string }>({
  rows,
  columns,
  loading = false,
  emptyMessage = 'No data',
  onRowPress,
  style,
  rowHeight = 52,
  headerHeight = 40,
}: AppDataTableProps<T>) {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir,   setSortDir]   = useState<SortDir>(null);
  const [sortCol,   setSortCol]   = useState<ColDef<T> | null>(null);

  const handleSort = useCallback((col: ColDef<T>) => {
    const field = String(col.field);
    if (sortField !== field) {
      setSortField(field); setSortDir('asc'); setSortCol(col);
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortField(null); setSortDir(null); setSortCol(null);
    }
  }, [sortField, sortDir]);

  const sorted = sortRows(rows, sortCol, sortDir);

  const headerBg = isDark ? '#0f172a' : '#f8fafc';
  const rowBg    = isDark ? '#1e293b' : '#ffffff';
  const altBg    = isDark ? '#172033' : '#f9fafb';
  const borderC  = isDark ? '#334155' : '#e5e7eb';

  return (
    <View style={[{ flex: 1, borderWidth: 1, borderColor: borderC, borderRadius: 8, overflow: 'hidden' }, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View>
          {/* ── Sticky header ── */}
          <View style={{
            flexDirection: 'row',
            height: headerHeight,
            backgroundColor: headerBg,
            borderBottomWidth: 2,
            borderBottomColor: borderC,
          }}>
            {columns.map((col) => (
              <HeaderCell
                key={String(col.field)}
                col={col}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                isDark={isDark}
              />
            ))}
          </View>

          {/* ── Rows ── */}
          {loading && rows.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: isDark ? '#64748b' : '#9ca3af', fontSize: 13 }}>Loading…</Text>
            </View>
          ) : sorted.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: isDark ? '#64748b' : '#9ca3af', fontSize: 13 }}>{emptyMessage}</Text>
            </View>
          ) : (
            <FlatList
              data={sorted}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => onRowPress?.(item)}
                  style={{
                    flexDirection: 'row',
                    height: rowHeight,
                    backgroundColor: index % 2 === 0 ? rowBg : altBg,
                    borderBottomWidth: 1,
                    borderBottomColor: borderC,
                  }}
                >
                  {columns.map((col) => (
                    <DataCell key={String(col.field)} col={col} row={item} isDark={isDark} />
                  ))}
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
