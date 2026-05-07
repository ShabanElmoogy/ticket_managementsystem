/**
 * StatsCards — Compact full-width stat cards row for the Dashboard.
 *
 * 6 cards in one row, each taking equal width.
 * Styled to match AdminStatCard but compact enough for 6 columns.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
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
  activeKey?: keyof ComputedStats | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Single card
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  cfg: StatCardConfig;
  value: number;
  onPress?: () => void;
  isActive: boolean;
  c: ReturnType<typeof useThemeColors>;
}

const StatCard: React.FC<CardProps> = ({ cfg, value, onPress, isActive, c }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: c.surface.primary,
            borderColor: isActive ? cfg.color : c.border.primary,
            borderWidth: isActive ? 1.5 : 1,
            shadowColor: c.shadow,
          },
          isActive && {
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }
        ]}
      >
        {/* Icon container */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: cfg.color + '15' }
        ]}>
          <Ionicons name={cfg.icon} size={16} color={cfg.color} />
        </View>

        {/* Value */}
        <Text
          style={[styles.valueText, { color: c.text.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {value.toLocaleString()}
        </Text>

        {/* Label */}
        <Text
          style={[styles.labelText, { color: c.text.secondary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {cfg.label}
        </Text>

        {/* Progress bar accent */}
        <View style={[styles.progressBase, { backgroundColor: cfg.color + '20' }]}>
          <View style={[styles.progressFill, { backgroundColor: cfg.color, width: isActive ? '100%' : '60%' }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC<{ c: ReturnType<typeof useThemeColors> }> = ({ c }) => (
  <View style={[styles.card, { backgroundColor: c.surface.primary, borderColor: c.border.primary, borderWidth: 1 }]}>
    <View style={[styles.iconContainer, { backgroundColor: c.surface.elevated }]} />
    <View style={{ width: '60%', height: 20, borderRadius: Radius.sm, backgroundColor: c.surface.elevated, marginBottom: 4 }} />
    <View style={{ width: '80%', height: 12, borderRadius: Radius.sm, backgroundColor: c.surface.elevated, marginBottom: 8 }} />
    <View style={[styles.progressBase, { backgroundColor: c.surface.elevated }]} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading, onCardPress, activeKey }) => {
  const c = useThemeColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={styles.scrollBase}
      decelerationRate="fast"
    >
      {STAT_CARDS.map((cfg) =>
        isLoading ? (
          <SkeletonCard key={cfg.key} c={c} />
        ) : (
          <StatCard
            key={cfg.key}
            cfg={cfg}
            value={stats[cfg.key]}
            isActive={activeKey === cfg.key}
            onPress={() => onCardPress?.(cfg.key)}
            c={c}
          />
        )
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: 0,
    paddingBottom: 0,
    gap: Spacing.sm,
    marginBottom : 10
  },
  scrollBase: {
    flexGrow: 0,
  },
  card: {
    width: 90,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs, // Reduced from sm
  },
  valueText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 24,
    textAlign: 'center',
  },
  labelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
    textAlign: 'center',
  },
  progressBase: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
    marginTop: Spacing.xs, // Reduced from sm
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});

export default StatsCards;
