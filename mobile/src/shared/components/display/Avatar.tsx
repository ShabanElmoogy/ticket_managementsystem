import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColors, FontWeight } from '@/src/constants/theme';

/**
 * Avatar
 *
 * Circular initials avatar. Derives up to 2 initials from a name string and
 * renders them centered in a filled circle.
 *
 * ## Initials logic
 * - Multi-word name  `"John Doe"`  → `"JD"`
 * - Single word      `"Alice"`     → `"AL"` (first 2 chars)
 * - Already initials `"JD"`        → `"JD"` (passed through as-is)
 *
 * ## Usage locations
 * - `AppHeaderBar.tsx`    — user avatar in the top navigation bar
 * - `DrawerUserCard.tsx`  — user card inside the side drawer
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * // Basic — derives initials from name, uses success green background
 * <Avatar text="John Doe" />
 *
 * @example
 * // Custom size and role-based color
 * <Avatar text={user.name} size={44} backgroundColor={getRoleColor(user.role)} />
 *
 * @example
 * // Detail screen hero card (rounded-square variant via style)
 * <Avatar
 *   text={customer.name}
 *   size={52}
 *   backgroundColor={statusColor + '22'}
 *   textColor={statusColor}
 *   style={{ borderRadius: 14 }}
 * />
 */
export interface AvatarProps {
  /**
   * Name or string to derive initials from.
   * - Multi-word: first letter of each word, up to 2 characters.
   * - Single word: first 2 characters.
   * - 1–2 characters: used as-is (uppercased).
   */
  text: string;
  /**
   * Circle background color.
   * @default c.intent.success
   */
  backgroundColor?: string;
  /**
   * Diameter of the circle in dp.
   * @default 32
   */
  size?: number;
  /**
   * Initials text color.
   * @default c.text.inverse
   */
  textColor?: string;
  /**
   * Font size of the initials. Defaults to `size / 3` (scales with circle).
   */
  fontSize?: number;
  /**
   * Accessible label announced by VoiceOver / TalkBack.
   * @default `${text} avatar`
   */
  accessibilityLabel?: string;
  /** Extra style merged onto the root `View`. Use to override `borderRadius` for square variants. */
  style?: ViewStyle;
}

// ── Initials helper ───────────────────────────────────────────────────────────

/**
 * Derive up to 2 initials from a name string.
 *
 * - `"John Doe"`  → `"JD"`
 * - `"Alice"`     → `"AL"`
 * - `"JD"`        → `"JD"`
 * - `""`          → `"?"`
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';

  const words = trimmed.split(/\s+/);

  if (words.length >= 2) {
    // Multi-word: first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Single word: first 2 characters
  return trimmed.slice(0, 2).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

const Avatar: React.FC<AvatarProps> = ({
  text,
  size            = 32,
  backgroundColor,
  textColor,
  fontSize,
  accessibilityLabel,
  style,
}) => {
  const c       = useThemeColors();
  const bg      = backgroundColor ?? c.intent.success;
  const fg      = textColor       ?? c.text.inverse;
  const fs      = fontSize        ?? Math.round(size / 3);
  const initials = getInitials(text);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${text} avatar`}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        style,
      ]}
    >
      <Text style={[styles.text, { color: fg, fontSize: fs }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text:      { fontWeight: FontWeight.bold },
});

export default Avatar;
