/**
 * StatsCards — Horizontal scroll row of stat cards for the Dashboard.
 *
 * Cards: Total, Open, In Progress, Programming, Resolved, Closed
 * Colors: Palette.* constants — no hardcoded hex.
 * Loading: animated skeleton placeholders while data is fetching.
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — not Modal-safe (screen only).
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated } = require('react-native') as { Animated: any };
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
  {
    key:     'total',
    label:   'Total',
    color:   Palette.blue600,
    bgColor: Palette.blue50,
    icon:    'ticket-outline',
  },
  {
    key:     'open',
    label:   'Open',
    color:   Palette.amber600,
    bgColor: Palette.amber50,
    icon:    'alert-circle-outline',
  },
  {
    key:     'inProgress',
    label:   'In Progress',
    color:   Palette.violet600,
    bgColor: Palette.violet50,
    icon:    'time-outline',
  },
  {
    key:     'programming',
    label:   'Programming',
    color:   Palette.indigo600,
    bgColor: Palette.indigo50,
    icon:    'code-slash-outline',
  },
  {
    key:     'resolved',
    label:   'Resolved',
    color:   Palette.emerald600,
    bgColor: Palette.emerald50,
    icon:    'checkmark-circle-outline',
  },
  {
    key:     'closed',
    label:   'Closed',
    color:   Palette.zinc500,
    bgColor: Palette.zinc100,
    icon:    'lock-closed-outline',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC<{ c: ReturnType<typeof useThemeColors> }> = ({ c }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        styles.card,
        {
          backgroundColor: c.surface.elevated,
          borderColor:     c.border.primary,
          opacity,
        },
      ]}
    >
      <View style={[styles.skeletonIcon, { backgroundColor: c.surface.tertiary }]} />
      <View style={[styles.skeletonValue, { backgroundColor: c.surface.tertiary }]} />
      <View style={[styles.skeletonLabel, { backgroundColor: c.surface.tertiary }]} />
    </AnimatedView>
  );
};

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {STAT_CARDS.map((cfg) => (
          <View key={String(cfg.key)}>
            <SkeletonCard c={c} />
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {STAT_CARDS.map((cfg) => {
        const value = stats[cfg.key];
        return (
          <Pressable
            key={cfg.key}
            onPress={() => onCardPress?.(cfg.key)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.card,
              {
                backgroundColor: cfg.bgColor,
                borderColor:     cfg.color + '33',
                opacity:         pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${cfg.label}: ${value}`}
          >
            {/* Icon badge */}
            <View style={[styles.iconBadge, { backgroundColor: cfg.color + '22' }]}>
              <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
            </View>

            {/* Value */}
            <Text style={[styles.value, { color: cfg.color }]}>
              {value}
            </Text>

            {/* Label */}
            <Text style={[styles.label, { color: cfg.color + 'cc' }]}>
              {cfg.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const CARD_WIDTH = 100;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    gap:               Spacing.sm,
  },
  card: {
    width:             CARD_WIDTH,
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius:      Radius.xl,
    borderWidth:       1,
    alignItems:        'center',
    gap:               Spacing.xs,
    shadowColor:       'rgba(0,0,0,0.06)',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     1,
    shadowRadius:      4,
    elevation:         2,
  },
  iconBadge: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.xs,
  },
  value: {
    fontSize:   FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    lineHeight: 28,
  },
  label: {
    fontSize:  FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  // Skeleton shapes
  skeletonIcon: {
    width:        36,
    height:       36,
    borderRadius: 18,
    marginBottom: Spacing.xs,
  },
  skeletonValue: {
    width:        40,
    height:       24,
    borderRadius: Radius.md,
  },
  skeletonLabel: {
    width:        60,
    height:       12,
    borderRadius: Radius.sm,
    marginTop:    Spacing.xs,
  },
});

export default StatsCards;
