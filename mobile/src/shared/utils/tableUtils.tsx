/**
 * Column definition helpers for AppDataTable.
 * Eliminates repeated renderCell boilerplate across table files.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Palette, FontSize, FontWeight, Radius, type ThemeColors } from '@/src/constants/tokens';
import type { ColDef } from '../components/data/AppDataTable';

// ── Column width constants ────────────────────────────────────────────────────

export const W = {
  customer: 180,
  num:       72,
  pct:       72,
  status:    90,
  priority:  80,
  title:    200,
  name:     140,
} as const;

// ── Re-export domain color maps for convenience ───────────────────────────────
export { StatusColors, PriorityColors } from '@/src/constants/tokens';

// ── Tinted badge (table cells only) ──────────────────────────────────────────

const TintedBadge: React.FC<{ label: string | number; color: string }> = ({ label, color }) => (
  <View style={{
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full,
    backgroundColor: color + '22', borderWidth: 1, borderColor: color + '55',
    alignSelf: 'center',
  }}>
    <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
  </View>
);

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
    renderCell: (r) => <TintedBadge label={r[field] as number} color={color} />,
  };
}

// ── Total column ──────────────────────────────────────────────────────────────

export function createTotalColumn<T>(
  c: ThemeColors,
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
  c: ThemeColors,
  width = 80,
  thresholds: [number, number] = [80, 50],
  colors: [string, string, string] = [Palette.green500, Palette.amber500, Palette.red500],
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

// ── Re-export Badge for external use ─────────────────────────────────────────
export { TintedBadge as Badge };
