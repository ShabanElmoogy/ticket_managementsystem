import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import StatBadge from './StatBadge';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

/**
 * A single stat item rendered as a `StatBadge` inside `StatCard`.
 * Exported so callers can type their `stats` arrays without importing
 * from the internal `StatBadge` file.
 */
export interface StatItem {
  label: string;
  value: number;
  color: string;
}

/**
 * StatCard
 *
 * A surface card with a title, optional subtitle, a row of colored
 * `StatBadge` pills, and an optional footer slot.
 *
 * ## Layout
 * ```
 * ┌─────────────────────────────────────────┐
 * │  Title                                  │
 * │  subtitle                               │
 * │                                         │
 * │  [stat1]  [stat2]  [stat3]              │
 * │                                         │
 * │  footer                                 │
 * └─────────────────────────────────────────┘
 * ```
 *
 * ## Usage locations
 * - `ReportGridCard.tsx` — grid view card for report rows
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * <StatCard
 *   title="Acme Corp"
 *   subtitle="24 total tickets"
 *   stats={[
 *     { label: 'Open',     value: 5,  color: '#f59e0b' },
 *     { label: 'Resolved', value: 18, color: '#10b981' },
 *   ]}
 * />
 */
export interface StatCardProps {
  /** Primary heading. Clamped to one line. */
  title: string;
  /** Secondary line below the title. */
  subtitle?: string;
  /**
   * Array of stat pills rendered in a wrapping row.
   * Each item maps to a `StatBadge`.
   */
  stats?: StatItem[];
  /** Optional node rendered below the stat badges. */
  footer?: React.ReactNode;
  /**
   * Accessible label for the card region.
   * @default title
   */
  accessibilityLabel?: string;
  /** Extra style merged onto the root `View`. Use for margin overrides. */
  style?: ViewStyle;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  stats,
  footer,
  accessibilityLabel,
  style,
}) => {
  const c = useThemeColors();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[
        {
          backgroundColor: c.surface.primary,
          borderRadius:    Radius.lg,
          borderWidth:     1,
          borderColor:     c.border.primary,
          padding:         14,
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize:    FontSize.md,
          fontWeight:  FontWeight.bold,
          color:       c.text.primary,
          marginBottom: 2,
        }}
      >
        {title}
      </Text>

      {subtitle != null && (
        <Text
          style={{
            fontSize:    FontSize.xs,
            color:       c.text.muted,
            marginBottom: stats?.length ? 10 : 0,
          }}
        >
          {subtitle}
        </Text>
      )}

      {stats && stats.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {stats.map((s) => (
            <View key={s.label}>
              <StatBadge label={s.label} value={s.value} color={s.color} />
            </View>
          ))}
        </View>
      )}

      {footer != null && (
        <View style={{ marginTop: 8 }}>
          {footer}
        </View>
      )}
    </View>
  );
};

export default StatCard;
