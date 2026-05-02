import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useThemeColors, FontWeight } from '@/src/constants/theme';

/**
 * Badge
 *
 * A small pill-shaped label. Used for role chips, version tags, and any
 * short categorical label that needs a colored background.
 *
 * ## Layout
 * ```
 * ╭──────────────╮
 * │  label text  │
 * ╰──────────────╯
 * ```
 *
 * ## Usage locations
 * - `DrawerUserCard.tsx` — role chip below the user's name in the side drawer
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * // Role chip with role-based color
 * <Badge
 *   label={role}
 *   backgroundColor={`${getRoleColor(role)}44`}
 *   textColor={c.text.inverse}
 *   style={{ alignSelf: 'flex-start', marginTop: 2 }}
 * />
 *
 * @example
 * // Version tag
 * <Badge label="v2.1.0" backgroundColor={c.intent.infoSurface} textColor={c.interactive.primary} />
 *
 * @example
 * // Default — uses theme surface + primary text
 * <Badge label="ACTIVE" />
 */
export interface BadgeProps {
  /** Text displayed inside the pill. Keep short — 1–3 words max. */
  label: string;
  /**
   * Pill background color.
   * @default c.surface.secondary
   */
  backgroundColor?: string;
  /**
   * Label text color.
   * @default c.text.primary
   */
  textColor?: string;
  /**
   * Font size of the label.
   * @default 11
   */
  fontSize?: number;
  /**
   * Accessible label announced by VoiceOver / TalkBack.
   * Use to add context, e.g. `"role: EMPLOYEE"`.
   * @default label
   */
  accessibilityLabel?: string;
  /** Extra style merged onto the root `View`. Use for `alignSelf`, `marginTop`, etc. */
  style?: ViewStyle;
  /** Extra style merged onto the `Text` node. */
  labelStyle?: TextStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  backgroundColor,
  textColor,
  fontSize = 11,
  accessibilityLabel,
  style,
  labelStyle,
}) => {
  const c  = useThemeColors();
  const bg = backgroundColor ?? c.surface.secondary;
  const fg = textColor       ?? c.text.primary;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.container, { backgroundColor: bg }, style]}
    >
      <Text style={[styles.text, { color: fg, fontSize }, labelStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius:     99,
    paddingHorizontal: 8,
    paddingVertical:   2,
    alignSelf:        'flex-start', // don't stretch to fill parent width
  },
  text: {
    fontWeight: FontWeight.semibold, // '600' — reads better than '500' at small sizes
  },
});

export default Badge;
