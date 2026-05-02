import React from 'react';
import { View, Text, Platform, type ViewStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

/** Cross-platform monospace font — mirrors CodeBlock. */
const MONOSPACE = Platform.select({ ios: 'Courier New', default: 'monospace' });

/**
 * A single labeled content block inside an `InfoCard`.
 */
export interface InfoCardSection {
  /**
   * Optional key for stable React reconciliation.
   * Falls back to `label` then array index when omitted.
   */
  key?:      string;
  /** Uppercase label rendered above the content. */
  label?:    string;
  /** Text content of the section. */
  content:   string;
  /**
   * Render content in a monospace font (for code, JSON, stack traces).
   * Uses `Courier New` on iOS, `monospace` on Android.
   */
  mono?:     boolean;
  /**
   * Clamp content to this many lines.
   * Omit to show all lines.
   */
  maxLines?: number;
  /**
   * Allow the user to long-press and copy the content.
   * Recommended for `mono` sections (error details, JSON).
   * @default false
   */
  selectable?: boolean;
}

/**
 * InfoCard
 *
 * A structured card with a colored top stripe, an emoji icon badge, a title,
 * an optional subtitle, an optional message block, and zero or more labeled
 * content sections.
 *
 * ## Layout
 * ```
 * ┌─────────────────────────────────────┐  ← colored top stripe
 * │  [icon]  Title                      │
 * │          subtitle                   │
 * │                                     │
 * │  ┌─ message ─────────────────────┐  │
 * │  └───────────────────────────────┘  │
 * │  ┌─ SECTION LABEL ───────────────┐  │
 * │  │  section content              │  │
 * │  └───────────────────────────────┘  │
 * │                          caption    │
 * └─────────────────────────────────────┘
 * ```
 *
 * ## Usage locations
 * - `ErrorCard.tsx` — maps `NetworkErrorDialog`'s `ErrorState` to this card
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * <InfoCard
 *   accentColor="#ef4444"
 *   icon="❌"
 *   title="Request Failed"
 *   subtitle="500 Internal Server Error"
 *   message="The server encountered an unexpected error."
 *   sections={[{
 *     key:       'details',
 *     label:     'Response Details',
 *     content:   JSON.stringify(error.details, null, 2),
 *     mono:      true,
 *     maxLines:  6,
 *     selectable: true,
 *   }]}
 *   caption="2026-05-03T12:00:00Z"
 * />
 */
export interface InfoCardProps {
  /** Accent color used for the top stripe and icon badge background tint. */
  accentColor: string;
  /** Emoji rendered in the icon badge. */
  icon:        string;
  /** Primary heading. */
  title:       string;
  /** Secondary line below the title, rendered in `accentColor`. */
  subtitle?:   string;
  /** Optional message block rendered below the header. */
  message?:    string;
  /** Zero or more labeled content sections. */
  sections?:   InfoCardSection[];
  /** Small right-aligned caption at the bottom (e.g. timestamp). */
  caption?:    string;
  /**
   * Accessible label for the card region.
   * @default title
   */
  accessibilityLabel?: string;
  /** Extra style merged onto the root `View`. */
  style?: ViewStyle;
}

const InfoCard: React.FC<InfoCardProps> = ({
  accentColor,
  icon,
  title,
  subtitle,
  message,
  sections = [],
  caption,
  accessibilityLabel,
  style,
}) => {
  const c = useThemeColors();

  return (
    <View
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[
        {
          backgroundColor: c.surface.primary,
          borderRadius:    Radius.xl,
          overflow:        'hidden',
          borderWidth:     1,
          borderColor:     c.border.primary,
        },
        style,
      ]}
    >
      {/* Colored top stripe */}
      <View style={{ height: 5, backgroundColor: accentColor }} />

      <View style={{ padding: 20 }}>
        {/* Header — icon + title + subtitle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{
            width:           44,
            height:          44,
            borderRadius:    Radius.lg,
            backgroundColor: accentColor + '18',
            alignItems:      'center',
            justifyContent:  'center',
          }}>
            <Text style={{ fontSize: FontSize['3xl'] }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text.primary }}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: accentColor }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Message block */}
        {!!message && (
          <View style={{
            backgroundColor: c.surface.secondary,
            borderRadius:    Radius.lg,
            borderWidth:     1,
            borderColor:     c.border.primary,
            padding:         12,
            marginBottom:    12,
          }}>
            <Text style={{ fontSize: FontSize.base, color: c.text.secondary, lineHeight: 20 }}>
              {message}
            </Text>
          </View>
        )}

        {/* Sections */}
        {sections.map((section, i) => (
          <View
            key={section.key ?? section.label ?? i}
            style={{
              backgroundColor: c.surface.secondary,
              borderRadius:    Radius.lg,
              borderWidth:     1,
              borderColor:     c.border.primary,
              padding:         12,
              marginBottom:    12,
            }}
          >
            {!!section.label && (
              <Text style={{
                fontSize:      FontSize.xs,
                fontWeight:    FontWeight.bold,
                color:         c.text.muted,
                marginBottom:  4,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {section.label}
              </Text>
            )}
            <Text
              selectable={section.selectable}
              numberOfLines={section.maxLines}
              style={{
                fontSize:   FontSize.xs,
                color:      c.text.secondary,
                lineHeight: 17,
                fontFamily: section.mono ? MONOSPACE : undefined,
              }}
            >
              {section.content}
            </Text>
          </View>
        ))}

        {/* Caption */}
        {!!caption && (
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, textAlign: 'right' }}>
            {caption}
          </Text>
        )}
      </View>
    </View>
  );
};

export default InfoCard;
