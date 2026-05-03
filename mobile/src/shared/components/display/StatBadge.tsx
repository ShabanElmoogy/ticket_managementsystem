import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { FontSize, FontWeight } from '@/src/constants/theme';

/**
 * StatBadge
 *
 * A small colored pill showing a numeric value above a short label.
 * Used exclusively inside `StatCard` to render its `stats` array.
 *
 * Background and border are derived from `color` using hex-alpha suffixes.
 * **`color` must be a 6-digit hex string** (`#rrggbb`).
 *
 * ## Layout
 * ```
 * ╭──────────╮
 * │    42    │  ← value (bold, accent color)
 * │  LABEL   │  ← label (uppercase, small, accent color)
 * ╰──────────╯
 * ```
 *
 * ## Usage locations
 * - `StatCard.tsx` — renders each item in the `stats` array
 *
 * ## Modal safety
 * ✅ Modal-safe — no hooks.
 */
export interface StatBadgeProps {
  /** Short uppercase label shown below the value. */
  label: string;
  /**
   * Display value. Accepts a pre-formatted string (e.g. `"99+"`, `"1.2k"`)
   * or a plain number.
   */
  value:  number | string;
  /**
   * Accent color for text, background tint, and border.
   * Must be a 6-digit hex string (`#rrggbb`).
   */
  color:  string;
  /** Extra style merged onto the root `View`. */
  style?: ViewStyle;
}

const StatBadge: React.FC<StatBadgeProps> = ({ label, value, color, style }) => (
  <View
    accessibilityRole="text"
    accessibilityLabel={`${value} ${label}`}
    style={[
      {
        alignItems:        'center',
        paddingHorizontal: 8,
        paddingVertical:   4,
        borderRadius:      8,
        backgroundColor:   color + '18', // ~10% opacity — color must be 6-digit hex
        borderWidth:       1,
        borderColor:       color + '33', // ~20% opacity
        minWidth:          44,
      },
      style,
    ]}
  >
    <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color }}>
      {value}
    </Text>
    <Text style={{
      fontSize:      FontSize.xs,
      color,
      fontWeight:    FontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    }}>
      {label}
    </Text>
  </View>
);

export default StatBadge;
