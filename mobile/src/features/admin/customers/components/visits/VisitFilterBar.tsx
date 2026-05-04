/**
 * VisitFilterBar.tsx
 * Horizontal scrollable status filter chips with live count badges.
 * All colors use c.* theme tokens — no hardcoded hex.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import s from './visits.styles';
import { VISIT_CFG, STATUS_FILTERS } from './visits.types';
import type { VisitStatus, CustomerVisit } from '@/src/services/api/types/index';

export type { VisitStatus };

interface Props {
  visits:         CustomerVisit[];
  activeFilter:   VisitStatus | 'ALL';
  onFilterChange: (f: VisitStatus | 'ALL') => void;
}

const VisitFilterBar: React.FC<Props> = ({ visits, activeFilter, onFilterChange }) => {
  const c = useThemeColors();

  return (
    <View style={[s.filterBar, { backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterContent}>
        {STATUS_FILTERS.map((f) => {
          const active = activeFilter === f.value;
          const cfg    = f.value !== 'ALL' ? VISIT_CFG[f.value as VisitStatus] : null;
          const color  = cfg?.color ?? c.interactive.primary;
          const bg     = cfg?.bg    ?? c.intent.infoSurface;
          const count  = f.value === 'ALL'
            ? visits.length
            : visits.filter((v) => v.status === f.value).length;

          return (
            <Pressable
              key={f.value}
              onPress={() => onFilterChange(f.value)}
              style={[
                s.filterChip,
                {
                  backgroundColor: active ? color : c.surface.elevated,
                  borderColor:     active ? color : c.border.primary,
                },
              ]}
            >
              <Text style={[s.filterChipText, { color: active ? c.text.inverse : c.text.secondary }]}>
                {f.label}
              </Text>
              {/* Count badge */}
              <View style={[
                s.filterCount,
                { backgroundColor: active ? c.text.inverse + '30' : bg },
              ]}>
                <Text style={[
                  s.filterCountText,
                  { color: active ? c.text.inverse : color },
                ]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default VisitFilterBar;
