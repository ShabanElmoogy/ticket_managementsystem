import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, FlatList, useWindowDimensions,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { useUiStore } from '../../../stores/uiStore';

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
  /** Controlled sort — when provided, AppDataTable skips internal sort state */
  sortField?: string | null;
  sortDir?: SortDir;
  onSortChange?: (field: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getColWidth<T>(col: ColDef<T>): number {
  // Uppercase bold ~9.5px per char + 20px padding
  const minForHeader = Math.ceil(col.headerName.length * 9.5 + 20);
  // If explicit width given, use the larger of the two
  if (col.width) return Math.max(col.width, minForHeader);
  return Math.max(minForHeader, 80);
}

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
  // Single-word titles never wrap; multi-word titles wrap at word boundary
  const isSingleWord = !col.headerName.includes(' ');

  return (
    <Pressable
      onPress={() => col.sortable !== false && onSort(col)}
      style={{
        width: col.flex ? undefined : getColWidth(col),
        flex: col.flex,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignItems: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: isDark ? '#334155' : '#e5e7eb',
        minHeight: 32,
      }}
    >
      <Text
        numberOfLines={isSingleWord ? 1 : 2}
        style={{
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
          color: isActive ? '#3b82f6' : isDark ? '#94a3b8' : '#6b7280',
          textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left',
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
      width: col.flex ? undefined : getColWidth(col),
      flex: col.flex,
      paddingHorizontal: 12,
      paddingVertical: 7,
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
  headerHeight = 32,
  sortField:  controlledSortField,
  sortDir:    controlledSortDir,
  onSortChange,
}: AppDataTableProps<T>) {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';
  const { width: screenWidth } = useWindowDimensions();

  // Internal sort state — only used when no controlled sort props are provided
  const [internalSortField, setInternalSortField] = useState<string | null>(null);
  const [internalSortDir,   setInternalSortDir]   = useState<SortDir>(null);
  const [internalSortCol,   setInternalSortCol]   = useState<ColDef<T> | null>(null);

  const isControlled = controlledSortField !== undefined;
  const sortField = isControlled ? (controlledSortField ?? null) : internalSortField;
  const sortDir   = isControlled ? (controlledSortDir   ?? null) : internalSortDir;

  const handleSort = useCallback((col: ColDef<T>) => {
    if (isControlled) {
      onSortChange?.(String(col.field));
      return;
    }
    const field = String(col.field);
    if (internalSortField !== field) {
      setInternalSortField(field); setInternalSortDir('asc'); setInternalSortCol(col);
    } else if (internalSortDir === 'asc') {
      setInternalSortDir('desc');
    } else {
      setInternalSortField(null); setInternalSortDir(null); setInternalSortCol(null);
    }
  }, [isControlled, onSortChange, internalSortField, internalSortDir]);

  // When controlled, find the matching ColDef for sorting
  const activeSortCol = isControlled
    ? (columns.find((c) => String(c.field) === sortField) ?? null)
    : internalSortCol;

  const sorted = sortRows(rows, activeSortCol, sortDir);

  // Total width of all fixed columns; flex columns will fill remaining space
  const totalFixedWidth = columns.reduce((sum, col) => sum + (col.flex ? 0 : getColWidth(col)), 0);
  const hasFlexCols = columns.some((c) => c.flex);
  // If no flex cols, ensure the table stretches to at least screen width
  const tableMinWidth = hasFlexCols ? screenWidth : Math.max(totalFixedWidth, screenWidth);

  const headerBg = isDark ? '#0f172a' : '#f8fafc';
  const rowBg    = isDark ? '#1e293b' : '#ffffff';
  const altBg    = isDark ? '#172033' : '#f9fafb';
  const borderC  = isDark ? '#334155' : '#e5e7eb';

  return (
    <View style={[{ flex: 1, borderWidth: 1, borderColor: borderC, borderRadius: 8, overflow: 'hidden' }, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View style={{ minWidth: tableMinWidth }}>
          {/* ── Sticky header ── */}
          <View style={{
            flexDirection: 'row',
            minHeight: headerHeight,
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
                    minHeight: rowHeight,
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
