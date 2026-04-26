import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, FlatList, useWindowDimensions,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { useThemeColors,FontSize, FontWeight, Radius, type ThemeColors } from '@/src/constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc' | null;

export interface ColDef<T> {
  field:        keyof T | string;
  headerName:   string;
  width?:       number;
  flex?:        number;
  sortable?:    boolean;
  align?:       'left' | 'center' | 'right';
  renderCell?:  (row: T) => React.ReactNode;
  valueGetter?: (row: T) => string | number | null | undefined;
}

export interface AppDataTableProps<T extends { id: string }> {
  rows:          T[];
  columns:       ColDef<T>[];
  loading?:      boolean;
  emptyMessage?: string;
  onRowPress?:   (row: T) => void;
  style?:        StyleProp<ViewStyle>;
  rowHeight?:    number;
  headerHeight?: number;
  sortField?:    string | null;
  sortDir?:      SortDir;
  onSortChange?: (field: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getColWidth<T>(col: ColDef<T>): number {
  const minForHeader = Math.ceil(col.headerName.length * 9.5 + 20);
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
  col, sortField, sortDir, onSort, c,
}: {
  col:       ColDef<T>;
  sortField: string | null;
  sortDir:   SortDir;
  onSort:    (col: ColDef<T>) => void;
  c:         ThemeColors;
}) => {
  const isActive    = sortField === String(col.field);
  const arrow       = isActive ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  const isSingleWord = !col.headerName.includes(' ');

  return (
    <Pressable
      onPress={() => col.sortable !== false && onSort(col)}
      style={{
        width:             col.flex ? undefined : getColWidth(col),
        flex:              col.flex,
        paddingHorizontal: 10,
        paddingVertical:   4,
        alignItems:        col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
        justifyContent:    'center',
        borderRightWidth:  1,
        borderRightColor:  c.border.primary,
        minHeight:         32,
      }}
    >
      <Text
        numberOfLines={isSingleWord ? 1 : 2}
        style={{
          fontSize:        FontSize.xs,
          fontWeight:      FontWeight.bold,
          textTransform:   'uppercase',
          letterSpacing:   0.3,
          color:           isActive ? c.border.focus : c.text.secondary,
          textAlign:       col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left',
        }}
      >
        {col.headerName}{arrow}
      </Text>
    </Pressable>
  );
};

// ── Data cell ─────────────────────────────────────────────────────────────────

const DataCell = <T,>({
  col, row, c,
}: {
  col: ColDef<T>;
  row: T;
  c:   ThemeColors;
}) => (
  <View
    style={{
      width:             col.flex ? undefined : getColWidth(col),
      flex:              col.flex,
      paddingHorizontal: 12,
      paddingVertical:   7,
      justifyContent:    'center',
      alignItems:        col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
      borderRightWidth:  1,
      borderRightColor:  c.surface.tertiary,
    }}
  >
    {col.renderCell ? (
      col.renderCell(row)
    ) : (
      <Text numberOfLines={2} style={{ fontSize: FontSize.base, color: c.text.primary }}>
        {getCellValue(row, col)}
      </Text>
    )}
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────

function AppDataTable<T extends { id: string }>({
  rows,
  columns,
  loading      = false,
  emptyMessage = 'No data',
  onRowPress,
  style,
  rowHeight    = 52,
  headerHeight = 32,
  sortField:   controlledSortField,
  sortDir:     controlledSortDir,
  onSortChange,
}: AppDataTableProps<T>) {
  // Single hook call — resolves correct tokens for current theme automatically
  const c = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();

  const [internalSortField, setInternalSortField] = useState<string | null>(null);
  const [internalSortDir,   setInternalSortDir]   = useState<SortDir>(null);
  const [internalSortCol,   setInternalSortCol]   = useState<ColDef<T> | null>(null);

  const isControlled = controlledSortField !== undefined;
  const sortField    = isControlled ? (controlledSortField ?? null) : internalSortField;
  const sortDir      = isControlled ? (controlledSortDir   ?? null) : internalSortDir;

  const handleSort = useCallback((col: ColDef<T>) => {
    if (isControlled) { onSortChange?.(String(col.field)); return; }
    const field = String(col.field);
    if (internalSortField !== field) {
      setInternalSortField(field); setInternalSortDir('asc'); setInternalSortCol(col);
    } else if (internalSortDir === 'asc') {
      setInternalSortDir('desc');
    } else {
      setInternalSortField(null); setInternalSortDir(null); setInternalSortCol(null);
    }
  }, [isControlled, onSortChange, internalSortField, internalSortDir]);

  const activeSortCol = isControlled
    ? (columns.find((col) => String(col.field) === sortField) ?? null)
    : internalSortCol;

  const sorted = sortRows(rows, activeSortCol, sortDir);

  const totalFixedWidth = columns.reduce((sum, col) => sum + (col.flex ? 0 : getColWidth(col)), 0);
  const hasFlexCols     = columns.some((col) => col.flex);
  const tableMinWidth   = hasFlexCols ? screenWidth : Math.max(totalFixedWidth, screenWidth);

  // Alternating row background — one step darker than primary surface
  const altRowBg = c.surface.secondary;

  return (
    <View style={[{
      flex: 1, borderWidth: 1, borderColor: c.border.primary,
      borderRadius: Radius.md, overflow: 'hidden',
    }, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View style={{ minWidth: tableMinWidth }}>

          {/* ── Header ── */}
          <View style={{
            flexDirection:     'row',
            minHeight:         headerHeight,
            backgroundColor:   c.surface.tertiary,
            borderBottomWidth: 2,
            borderBottomColor: c.border.primary,
          }}>
            {columns.map((col) => (
              <HeaderCell
                key={String(col.field)}
                col={col}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                c={c}
              />
            ))}
          </View>

          {/* ── Body ── */}
          {loading && rows.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: c.text.muted, fontSize: FontSize.base }}>Loading…</Text>
            </View>
          ) : sorted.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: c.text.muted, fontSize: FontSize.base }}>{emptyMessage}</Text>
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
                    flexDirection:     'row',
                    minHeight:         rowHeight,
                    backgroundColor:   index % 2 === 0 ? c.surface.primary : altRowBg,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border.primary,
                  }}
                >
                  {columns.map((col) => (
                    <DataCell key={String(col.field)} col={col} row={item} c={c} />
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
