import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';

/**
 * ActionRow
 *
 * A tappable list row with a circular badge on the left, a title + optional
 * subtitle in the middle, and an optional slot on the right.
 *
 * ## Layout
 * ```
 * ┌──────────────────────────────────────────────┐
 * │  [badge]  Title                   [rightSlot]│
 * │           Subtitle                           │
 * └──────────────────────────────────────────────┘
 * ```
 *
 * ## Usage locations
 * - `NetworkErrorDialog/components/SharePanel.tsx`
 *   - "Send to Support" row (WhatsApp share)
 *   - "Share Screenshot" row (system share sheet)
 *
 * ## Modal safety
 * ✅ Modal-safe — calls `useThemeColors()` at component level, before any
 * `<Modal>` renders. Safe to use inside `PanelCard` and other modal wrappers.
 *
 * @example
 * // Basic action row with emoji badge
 * <ActionRow
 *   badgeContent={<Text style={{ fontSize: 19 }}>💬</Text>}
 *   badgeColor={WA_GREEN}
 *   badgeGlow
 *   title="Send to Support"
 *   subtitle="+1 234 567 8900"
 *   rightSlot={<WhatsAppBadge />}
 *   pressedBg={c.intent.successSurface}
 *   onPress={handleWhatsAppShare}
 *   loading={sharing}
 *   disabled={busy}
 * />
 *
 * @example
 * // Row with chevron right slot
 * <ActionRow
 *   badgeContent={<Text style={{ fontSize: 19 }}>🖼️</Text>}
 *   badgeColor={c.surface.elevated}
 *   title="Share Screenshot"
 *   subtitle="Save or send to any app"
 *   rightSlot={<Text style={{ fontSize: 18, color: c.text.secondary }}>›</Text>}
 *   onPress={handleImageShare}
 *   loading={capturing}
 * />
 */
export interface ActionRowProps {
  /** Icon, emoji `<Text>`, or any node rendered inside the circular badge. */
  badgeContent: React.ReactNode;
  /** Background fill of the badge circle. */
  badgeColor: string;
  /**
   * When `true`, adds a soft drop-shadow in `badgeColor` behind the circle.
   * Use for primary/branded actions (e.g. WhatsApp green).
   * @default false
   */
  badgeGlow?: boolean;
  /** Primary label. Also used as the default `accessibilityLabel`. */
  title: string;
  /** Secondary label rendered below `title` in a smaller muted style. */
  subtitle?: string;
  /**
   * Node rendered flush to the right edge.
   * Common values: a chevron `›`, a badge chip, or a status indicator.
   */
  rightSlot?: React.ReactNode;
  /**
   * Row background color when pressed.
   * @default c.interactive.pressed
   */
  pressedBg?: string;
  /** Called when the row is tapped. No-op when `disabled` or `loading`. */
  onPress: () => void;
  /**
   * Prevents interaction and reduces opacity to 0.55.
   * @default false
   */
  disabled?: boolean;
  /**
   * Replaces `badgeContent` with a spinner and prevents interaction.
   * Use while an async action triggered by this row is in progress.
   * @default false
   */
  loading?: boolean;
  /**
   * Label announced by VoiceOver / TalkBack.
   * @default title
   */
  accessibilityLabel?: string;
  /** Extra style merged onto the root `Pressable`. Use for margin overrides. */
  style?: ViewStyle;
}

const ActionRow: React.FC<ActionRowProps> = ({
  badgeContent,
  badgeColor,
  badgeGlow = false,
  title,
  subtitle,
  rightSlot,
  pressedBg,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
}) => {
  const c = useThemeColors();
  const resolvedPressedBg = pressedBg ?? c.interactive.pressed;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }: { pressed: boolean }) => [
        {
          flexDirection:     'row',
          alignItems:        'center',
          gap:               12,
          paddingHorizontal: 14,
          paddingVertical:   13,
          backgroundColor:   pressed ? resolvedPressedBg : 'transparent',
          opacity:           isDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {/* Badge */}
      <View
        style={{
          width:           40,
          height:          40,
          borderRadius:    20,
          backgroundColor: badgeColor,
          alignItems:      'center',
          justifyContent:  'center',
          ...(badgeGlow && {
            shadowColor:   badgeColor,
            shadowOffset:  { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius:  5,
            elevation:     3,
          }),
        }}
      >
        {loading
          ? <ActivityIndicator size="small" color={c.text.inverse} />
          : badgeContent}
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize:   FontSize.base,
            fontWeight: FontWeight.bold,
            color:      c.text.primary,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={{
              fontSize:  FontSize.xs,
              color:     c.text.secondary,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right slot */}
      {!!rightSlot && rightSlot}
    </Pressable>
  );
};

export default ActionRow;
