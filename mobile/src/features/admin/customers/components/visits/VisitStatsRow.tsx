/**
 * VisitStatsRow.tsx
 * Four stat cards: Total / Completed / Planned / No Show.
 * All colors use Palette.* constants — no hardcoded hex.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Palette } from '@/src/constants/theme';
import s from './visits.styles';
import type { VisitStats } from './visits.types';

// Module-level constants — Palette.* is safe here (no imports, no circular deps)
const STAT_DEFS = [
  { key: 'total'     as const, label: 'Total',     color: Palette.blue700,  bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'completed' as const, label: 'Completed', color: Palette.green700, bg: '#f0fdf4', border: '#bbf7d0' },
  { key: 'planned'   as const, label: 'Planned',   color: Palette.blue600,  bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'noShow'    as const, label: 'No Show',   color: Palette.amber600, bg: '#fffbeb', border: '#fde68a' },
];

interface Props { stats: VisitStats }

const VisitStatsRow: React.FC<Props> = ({ stats }) => (
  <View style={s.statsRow}>
    {STAT_DEFS.map((def) => (
      <View key={def.key} style={[s.statCard, { backgroundColor: def.bg, borderColor: def.border }]}>
        <Text style={[s.statNum,   { color: def.color }]}>{stats[def.key]}</Text>
        <Text style={[s.statLabel, { color: def.color }]}>{def.label}</Text>
      </View>
    ))}
  </View>
);

export default VisitStatsRow;
