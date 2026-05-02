import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { FontSize, FontWeight } from '@/src/constants/theme';

/**
 * InlineBanner
 *
 * A compact tinted row with an optional icon and a single-line message.
 * Used for status hints, warnings, and info notices inside dialogs or screens.
 *
 * The background is derived from `color` at ~10% opacity by appending `'18'`
 * to the hex string. **`color` must be a 6-digit hex value** (`#rrggbb`).
 * Passing `rgb(...)`, `hsl(...)`, or named colors will produce an invalid color.
 *
 * ## Layout
 * ```
 * ╭──────────────────────────────────────╮
 * │  [icon]  message text                │
 * ╰──────────────────────────────────────╯
 * ```
 *
 * ## Modal safety
 * ✅ Modal-safe — no hooks. All colors are resolved from the `color` prop.
 *
 * ## Usage locations
 * - `ErrorExtraBanner.tsx` — status hints in `NetworkErrorDialog`
 *   - "Connection restored — saving your data…" (green)
 *   - "N requests failed simultaneously" (red)
 *
 * @example
 * <InlineBanner icon="🔄" message="Reconnecting…" color="#10b981" />
 *
 * @example
 * <InlineBanner icon="⚠️" message="3 requests failed" color="#ef4444" />
 *
 * @example
 * // With margin override
 * <InlineBanner icon="ℹ️" message="Read-only mode" color="#3b82f6" style={{ marginBottom: 8 }} />
 */
export interface InlineBannerProps {
  /**
   * Emoji or short string shown on the left.
   * Omit to show message only.
   */
  icon?: string;
  /** Banner message text. */
  message: string;
  /**
   * Accent color used for the text and tinted background.
   * **Must be a 6-digit hex string** (`#rrggbb`).
   */
  color: string;
  /** Extra style merged onto the root `View`. Use for margin overrides. */
  style?: ViewStyle;
}

const InlineBanner: React.FC<InlineBannerProps> = ({
  icon,
  message,
  color,
  style,
}) => (
  <View
    accessibilityRole="alert"
    accessibilityLabel={message}
    style={[
      {
        flexDirection:     'row',
        alignItems:        'center',
        gap:               8,
        backgroundColor:   color + '18', // ~10% opacity tint
        borderRadius:      8,
        paddingHorizontal: 10,
        paddingVertical:   8,
      },
      style,
    ]}
  >
    {!!icon && (
      <Text style={{ fontSize: FontSize.sm }}>{icon}</Text>
    )}
    <Text style={{ flex: 1, fontSize: FontSize.xs, color, fontWeight: FontWeight.semibold, lineHeight: 17 }}>
      {message}
    </Text>
  </View>
);

export default InlineBanner;
