/**
 * StatsCards — Compact full-width stat cards row for the Dashboard.
 *
 * 6 cards in one row, each taking equal width.
 * Styled to match AdminStatCard but compact enough for 6 columns.
 */

import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import type { ComputedStats } from '@/src/features/dashboard/utils/computeStats';
import type { IoniconName } from '@/src/components/layout/header/navItems';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardConfig {
  key: keyof ComputedStats;
  label: string;
  color: string;
  icon: IoniconName;
}

const STAT_CARDS: StatCardConfig[] = [
  { key: 'total', label: 'Total', color: Palette.blue500, icon: 'ticket' },
  { key: 'open', label: 'Open', color: Palette.amber500, icon: 'lock-open' },
  { key: 'inProgress', label: 'Progress', color: Palette.violet500, icon: 'flash' },
  { key: 'programming', label: 'Dev', color: Palette.indigo500, icon: 'code-slash' },
  { key: 'resolved', label: 'Resolved', color: Palette.emerald500, icon: 'checkmark-done' },
  { key: 'closed', label: 'Closed', color: Palette.zinc500, icon: 'lock-closed' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface StatsCardsProps {
  stats: ComputedStats;
  isLoading: boolean;
  onCardPress?: (key: keyof ComputedStats) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Single card
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  cfg: StatCardConfig;
  value: number;
  cardWidth: number;
  onPress?: () => void;
  c: ReturnType<typeof useThemeColors>;
}

const StatCard: React.FC<CardProps> = ({ cfg, value, cardWidth, onPress, c }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flex: 1,
      borderRadius: Radius.lg,
      padding: 8,
      backgroundColor: c.surface.primary,
      alignItems: 'center',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
      opacity: pressed ? 0.85 : 1,
    })}
  >
      {/* Icon + dot row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{
          width: 28,
          height: 28,
          borderRadius: Radius.md,
          backgroundColor: cfg.color + '20',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Ionicons name={cfg.icon} size={14} color={cfg.color} />
        </View>
      </View>

      {/* Value */}
      <Text
        style={{
          fontSize: FontSize.xl,
          alignSelf: 'center',
          fontWeight: FontWeight.extrabold,
          color: c.text.primary,
          lineHeight: 24,
          marginInline: 'auto'
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value.toLocaleString()}
      </Text>

      {/* Label */}
      <Text
        style={{
          fontSize: FontSize.xs,
          alignSelf: 'center',
          fontWeight: FontWeight.medium,
          color: c.text.secondary,
          marginTop: 2,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {cfg.label}
      </Text>

    {/* Progress bar */}
    <View style={{ height: 2, borderRadius: 1, marginTop: 6, backgroundColor: cfg.color + '25' }}>
      <View style={{ height: '100%', borderRadius: 1, backgroundColor: cfg.color, width: '60%' }} />
    </View>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC<{ cardWidth: number; c: ReturnType<typeof useThemeColors> }> = ({ cardWidth, c }) => (
  <View style={{
    flex: 1,
    borderRadius: Radius.lg,
    padding: 8,
    backgroundColor: c.surface.primary,
    elevation: 3,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <View style={{ width: 28, height: 28, borderRadius: Radius.md, backgroundColor: c.surface.elevated }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.surface.elevated }} />
    </View>
    <View style={{ width: '70%', height: 18, borderRadius: Radius.sm, backgroundColor: c.surface.elevated, marginBottom: 4 }} />
    <View style={{ width: '90%', height: 10, borderRadius: Radius.sm, backgroundColor: c.surface.elevated, marginBottom: 6 }} />
    <View style={{ height: 2, borderRadius: 1, backgroundColor: c.surface.elevated }} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading, onCardPress }) => {
  const c = useThemeColors();
  return (
    <View style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm
    }}>
      {STAT_CARDS.map((cfg) =>
        isLoading ? (
          <SkeletonCard key={cfg.key} cardWidth={0} c={c} />
        ) : (
          <StatCard
            key={cfg.key}
            cfg={cfg}
            value={stats[cfg.key]}
            cardWidth={0}
            onPress={() => onCardPress?.(cfg.key)}
            c={c}
          />
        )
      )}
    </View>
  );
};

export default StatsCards;
