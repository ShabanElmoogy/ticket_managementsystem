import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';

// ── Callout variant config ────────────────────────────────────────────────────

/**
 * Built-in callout variants with pre-defined color tokens.
 * Export these so callers can resolve colors without defining their own tables.
 *
 * @example
 * import { CALLOUT_CONFIGS } from '@/src/shared/components';
 * const cfg = CALLOUT_CONFIGS.warning;
 * // cfg.color, cfg.lightBg, cfg.darkBg, cfg.lightBorder, cfg.darkBorder, cfg.emoji
 */
export interface CalloutConfig {
  color:       string;
  lightBg:     string;
  darkBg:      string;
  lightBorder: string;
  darkBorder:  string;
  emoji:       string;
}

export const CALLOUT_CONFIGS: Record<'info' | 'warning' | 'success' | 'error', CalloutConfig> = {
  info: {
    color:       '#3b82f6',
    lightBg:     '#eff6ff',
    darkBg:      '#1e3a5f',
    lightBorder: '#bfdbfe',
    darkBorder:  '#3b82f655',
    emoji:       'ℹ️',
  },
  warning: {
    color:       '#f59e0b',
    lightBg:     '#fffbeb',
    darkBg:      '#451a03',
    lightBorder: '#fde68a',
    darkBorder:  '#f59e0b55',
    emoji:       '⚠️',
  },
  success: {
    color:       '#10b981',
    lightBg:     '#f0fdf4',
    darkBg:      '#052e16',
    lightBorder: '#bbf7d0',
    darkBorder:  '#10b98155',
    emoji:       '✅',
  },
  error: {
    color:       '#ef4444',
    lightBg:     '#fef2f2',
    darkBg:      '#450a0a',
    lightBorder: '#fecaca',
    darkBorder:  '#ef444455',
    emoji:       '❌',
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * CalloutBox
 *
 * A styled container with a colored top stripe, an emoji icon badge, and a
 * content slot. Used for callout blocks in docs, alert banners, and any
 * content that needs a visually distinct framed presentation.
 *
 * ## Layout
 * ```
 * ┌─────────────────────────────────────┐  ← colored top stripe
 * │  [emoji]  children                  │
 * └─────────────────────────────────────┘
 * ```
 *
 * ## Color resolution
 * Pass pre-resolved `bg` and `border` — use `CALLOUT_CONFIGS` to resolve
 * them from a variant name without defining your own color table:
 *
 * ```ts
 * const cfg = CALLOUT_CONFIGS[block.calloutType];
 * const bg     = isDark ? cfg.darkBg     : cfg.lightBg;
 * const border = isDark ? cfg.darkBorder : cfg.lightBorder;
 * ```
 *
 * ## Modal safety
 * ✅ Modal-safe — no hooks. All colors are resolved by the caller and passed
 * as props. Safe to use inside `CalloutEditor` and other modal trees.
 *
 * ## Usage locations
 * - `CalloutEditor.tsx` — editable callout block in the docs editor
 *
 * @example
 * // Using CALLOUT_CONFIGS for color resolution
 * const cfg    = CALLOUT_CONFIGS.info;
 * const bg     = isDark ? cfg.darkBg     : cfg.lightBg;
 * const border = isDark ? cfg.darkBorder : cfg.lightBorder;
 *
 * <CalloutBox color={cfg.color} bg={bg} border={border} emoji={cfg.emoji}>
 *   <Text>This is an info callout.</Text>
 * </CalloutBox>
 *
 * @example
 * // Read-only display (no TextInput child)
 * <CalloutBox color={cfg.color} bg={bg} border={border} emoji={cfg.emoji}>
 *   <Text style={{ fontSize: 14, color: textColor }}>{block.text}</Text>
 * </CalloutBox>
 */
export interface CalloutBoxProps {
  /** Accent color — used for the top stripe and the emoji badge background tint. */
  color:    string;
  /**
   * Resolved background color for the current color scheme.
   * Use `CALLOUT_CONFIGS[variant].lightBg` or `.darkBg`.
   */
  bg:       string;
  /**
   * Resolved border color for the current color scheme.
   * Use `CALLOUT_CONFIGS[variant].lightBorder` or `.darkBorder`.
   */
  border:   string;
  /** Emoji rendered inside the icon badge. Use `CALLOUT_CONFIGS[variant].emoji`. */
  emoji:    string;
  /** Content rendered in the slot to the right of the emoji badge. */
  children: React.ReactNode;
  /**
   * Accessible label for the callout region.
   * Defaults to `"${emoji} callout"`.
   */
  accessibilityLabel?: string;
  /** Extra style merged onto the root `View`. */
  style?: ViewStyle;
}

// ── Component ─────────────────────────────────────────────────────────────────

const CalloutBox: React.FC<CalloutBoxProps> = ({
  color,
  bg,
  border,
  emoji,
  children,
  accessibilityLabel,
  style,
}) => (
  <View
    accessibilityRole="none"
    accessibilityLabel={accessibilityLabel ?? `${emoji} callout`}
    style={[
      {
        borderRadius:    12,
        overflow:        'hidden',
        borderWidth:     1.5,
        borderColor:     border,
        backgroundColor: bg,
      },
      style,
    ]}
  >
    {/* Colored top stripe */}
    <View style={{ height: 3, backgroundColor: color }} />

    <View style={{ flexDirection: 'row', gap: 12, padding: 14 }}>
      {/* Emoji icon badge */}
      <View
        style={{
          width:           36,
          height:          36,
          borderRadius:    10,
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: color + '22',
          flexShrink:      0,
        }}
      >
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>

      {/* Content slot */}
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  </View>
);

export default CalloutBox;
