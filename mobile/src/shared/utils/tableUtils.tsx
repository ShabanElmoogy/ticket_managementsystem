/**
 * Column definition helpers for AppDataTable.
 * Eliminates repeated renderCell boilerplate across table files.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Badge, W } from '../components/data/AppTable';
import type { ColDef } from '../components/data/AppDataTable';

// ── Badge column ──────────────────────────────────────────────────────────────

/**
 * Creates a numeric column that renders a colored badge.
 * Used for Open, Resolved, Closed, Overdue, etc.
 */
export function createBadgeColumn<T>(
  field: keyof T,
  headerName: string,
  color: string,
  width = W.num,
): ColDef<T> {
  return {
    field,
    headerName,
    width,
    align: 'center',
    renderCell: (r) => <Badge label={r[field] as number} color={color} />,
  };
}

// ── Total column ──────────────────────────────────────────────────────────────

/**
 * Creates a bold "Total" column.
 * Used in SummaryTable, StatusTable, SlaTable.
 */
export function createTotalColumn<T>(
  isDark: boolean,
  field: keyof T = 'total' as keyof T,
  headerName = 'Total',
  width = W.num,
): ColDef<T> {
  return {
    field,
    headerName,
    width,
    align: 'center',
    renderCell: (r) => (
      <Text style={{ fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 13 }}>
        {r[field] as number}
      </Text>
    ),
  };
}

// ── Percent column ────────────────────────────────────────────────────────────

/**
 * Creates a percentage column with fixed-color text.
 * Used for openPct, resolvedPct in StatusTable.
 */
export function createPercentColumn<T>(
  field: keyof T,
  headerName: string,
  color: string,
  width = W.pct,
): ColDef<T> {
  return {
    field,
    headerName,
    width,
    align: 'center',
    renderCell: (r) => (
      <Text style={{ fontSize: 12, color, fontWeight: '600' }}>
        {(r[field] as number).toFixed(1)}%
      </Text>
    ),
  };
}

// ── Threshold column ──────────────────────────────────────────────────────────

/**
 * Creates a column that shows a count + percentage with threshold-based coloring.
 * Used for "On Time" in SlaTable.
 *
 * @param getCount   - returns the count value from the row
 * @param getTotal   - returns the denominator for percentage calculation
 * @param thresholds - [high, mid] percentage thresholds (default [80, 50])
 * @param colors     - [high, mid, low] colors (default green/amber/red)
 */
export function createThresholdColumn<T>(
  field: keyof T,
  headerName: string,
  getCount: (r: T) => number,
  getTotal: (r: T) => number,
  isDark: boolean,
  width = 80,
  thresholds: [number, number] = [80, 50],
  colors: [string, string, string] = ['#10b981', '#f59e0b', '#ef4444'],
): ColDef<T> {
  return {
    field,
    headerName,
    width,
    align: 'center',
    renderCell: (r) => {
      const count = getCount(r);
      const total = getTotal(r);
      const pct   = total > 0 ? Math.round((count / total) * 100) : null;

      if (pct === null) {
        return <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#94a3b8' }}>—</Text>;
      }

      const color = pct >= thresholds[0] ? colors[0] : pct >= thresholds[1] ? colors[1] : colors[2];

      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color }}>{count}</Text>
          <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>{pct}%</Text>
        </View>
      );
    },
  };
}
