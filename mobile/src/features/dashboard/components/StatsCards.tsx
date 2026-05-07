/**
 * StatsCards — Full-width row of stat cards for the Dashboard.
 *
 * Cards fill the full screen width evenly (flex: 1 each).
 * Colors: Palette.* constants — no hardcoded hex.
 * Loading: skeleton placeholders while data is fetching.
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — not Modal-safe (screen only).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import type { ComputedStats } from '@/src/features/dashboard/utils/computeStats';

// ─────────────────────────────────────────────────────────────────────────────
// Card config
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardConfig {
  key:     keyof ComputedStats;
  label:   string;
  color:   string;
  bgColor: string;
  icon:    string;
}

const STAT_CARDS: StatCardConfig[] = [
  { key: 'total',       label: 'Total',       color: Palette.blue600,    bgColor: Palette.blue50,    icon: 'ticket-outline'           },
  { key: 'open',        label: 'Open',        color: Palette.amber600,   bgColor: Palette.amber50,   icon: 'alert-circle-outline'     },
  { key: 'inProgress',  label: 'In Progress', color: Palette.violet600,  bgColor: Palette.violet50,  icon: 'time-outline'             },
  { key: 'programming', label: 'Dev',         color: Palette.indigo600,  bgColor: Palette.indigo50,  icon: 'code-slash-outline'       },
  { key: 'resolved',    label: 'Resolved',    color: Palette.emerald600, bgColor: Palette.emerald50, icon: 'checkmark-circle-outline' },
  { key: 'closed',      label: 'Closed',      color: Palette.zinc500,    bgColor: Palette.zinc100,   icon: 'lock-closed-outline'      },
];

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC<{ c: ReturnType<typeof useThemeColors> }> = ({ c }) => (
  <View style={[styles.card, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}>
    <View style={[styles.skeletonIcon, { backgroundColor: c.surface.tertiary }]} />
    <View style={[styles.skeletonValue, { backgroundColor: c.surface.tertiary }]} />
    <View style={[styles.skeletonLabel, { backgroundColor: c.surface.tertiary }]} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface StatsCardsProps {
  stats:        ComputedStats;
  isLoading:    boolean;
  onCardPress?: (key: keyof ComputedStats) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading, onCardPress }) => {
  const c = useThemeColors();

  if (isLoading) {
    return (
      <View style={styles.row}>
        {STAT_CARDS.map((cfg) => (
          <View key={String(cfg.key)} style={styles.cardWrapper}>
            <View style={[styles.card, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}>
              <View style={[styles.skeletonIcon, { backgroundColor: c.surface.tertiary }]} />
              <View style={[styles.skeletonValue, { backgroundColor: c.surface.tertiary }]} />
              <View style={[styles.skeletonLabel, { backgroundColor: c.surface.tertiary }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {STAT_CARDS.map((cfg) => {
        const value = stats[cfg.key];
        return (
          <View key={cfg.key} style={styles.cardWrapper}>
            <Pressable
              onPress={() => onCardPress?.(cfg.key)}
              style={({ pressed }: { pressed: boolean }) => [
                styles.card,
                {
                  backgroundColor: cfg.bgColor,
                  borderColor:     cfg.color + '33',
                  opacity:         pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${cfg.label}: ${value}`}
            >
              <View style={[styles.iconBadge, { backgroundColor: cfg.color + '22' }]}>
                <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
              </View>
              <Text style={[styles.value, { color: cfg.color }]} numberOfLines={1} adjustsFontSizeToFit>
                {value}
              </Text>
              <Text style={[styles.label, { color: cfg.color + 'cc' }]} numberOfLines={1} adjustsFontSizeToFit>
                {cfg.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    paddingHorizontal: Spacing.xs,
    paddingVertical:   Spacing.sm,
    gap:               4,
    width:             '100%',
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    flex:              1,
    paddingVertical:   Spacing.sm,
    paddingHorizontal: 2,
    borderRadius:      Radius.lg,
    borderWidth:       1,
    alignItems:        'center',
    gap:               2,
    elevation:         2,
  },
  iconBadge: {
    width:          26,
    height:         26,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   2,
  },
  value: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.extrabold,
    lineHeight: 20,
    minWidth:   1,
  },
  label: {
    fontSize:  9,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    minWidth:  1,
  },
  // Skeleton shapes
  skeletonIcon: {
    width:        26,
    height:       26,
    borderRadius: 13,
    marginBottom: 2,
  },
  skeletonValue: {
    width:        28,
    height:       16,
    borderRadius: Radius.sm,
  },
  skeletonLabel: {
    width:        36,
    height:       9,
    borderRadius: Radius.sm,
    marginTop:    2,
  },
});

export default StatsCards;
