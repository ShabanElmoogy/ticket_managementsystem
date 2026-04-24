/**
 * Column definition helpers for AppDataTable.
 * Eliminates repeated renderCell boilerplate across table files.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Badge, W } from '../components/data/AppTable';
import { Colors, Palette, FontSize, FontWeight } from '../../constants/theme';
import type { ColDef } from '../components/data/AppDataTable';

// ── Badge column ──────────────────────────────────────────────────────────────

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

export function createTotalColumn<T>(
  isDark: boolean,
  field: keyof T = 'total' as keyof T,
  headerName = 'Total',
  width = W.num,
): ColDef<T> {
  const c = isDark ? Colors.dark : Colors.light;
  return {
    field,
    headerName,
    width,
    align: 'center',
    renderCell: (r) => (
      <Text style={{ fontWeight: FontWeight.bold, color: c.text.primary, fontSize: FontSize.base }}>
        {r[field] as number}
      </Text>
    ),
  };
}

// ── Percent column ────────────────────────────────────────────────────────────

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
      <Text style={{ fontSize: FontSize.sm, color, fontWeight: FontWeight.semibold }}>
        {(r[field] as number).toFixed(1)}%
      </Text>
    ),
  };
}

// ── Threshold column ──────────────────────────────────────────────────────────

export function createThresholdColumn<T>(
  field: keyof T,
  headerName: string,
  getCount: (r: T) => number,
  getTotal: (r: T) => number,
  isDark: boolean,
  width = 80,
  thresholds: [number, number] = [80, 50],
  colors: [string, string, string] = [Palette.green500, Palette.amber500, Palette.red500],
): ColDef<T> {
  const c = isDark ? Colors.dark : Colors.light;
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
        return <Text style={{ fontSize: FontSize.sm, color: c.text.muted }}>—</Text>;
      }

      const color = pct >= thresholds[0] ? colors[0] : pct >= thresholds[1] ? colors[1] : colors[2];

      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.bold, color }}>{count}</Text>
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted }}>{pct}%</Text>
        </View>
      );
    },
  };
}
