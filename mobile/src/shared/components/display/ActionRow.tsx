import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';

export interface ActionRowProps {
  /** Rendered inside the left circle badge */
  badgeContent:     React.ReactNode;
  /** Circle badge background color */
  badgeColor:       string;
  /** Optional glow shadow on the badge (e.g. for brand colors) */
  badgeGlow?:       boolean;
  /** Primary label */
  title:            string;
  /** Secondary label below the title */
  subtitle?:        string;
  /** Element rendered on the right (badge chip, chevron, etc.) */
  rightSlot?:       React.ReactNode;
  /** Pressed background color override */
  pressedBg?:       string;
  onPress:          () => void;
  disabled?:        boolean;
  /** Show spinner instead of badgeContent while loading */
  loading?:         boolean;
  /** Dim the row when disabled/loading */
  busyOpacity?:     number;
  isDark?:          boolean;
}

/**
 * ActionRow — a tappable row with a circular icon badge on the left,
 * a title + subtitle in the middle, and an optional right slot.
 *
 * Used for share option rows, settings items, or any list action.
 *
 * @example
 * <ActionRow
 *   badgeContent={<Text>💬</Text>}
 *   badgeColor="#25D366"
 *   badgeGlow
 *   title="Send to Support"
 *   subtitle="+1234567890"
 *   rightSlot={<AppBadge label="WhatsApp" color="#128C7E" />}
 *   onPress={handleWhatsApp}
 *   loading={sending}
 *   isDark={isDark}
 * />
 */
const ActionRow: React.FC<ActionRowProps> = ({
  badgeContent,
  badgeColor,
  badgeGlow    = false,
  title,
  subtitle,
  rightSlot,
  pressedBg,
  onPress,
  disabled     = false,
  loading      = false,
  busyOpacity  = 0.55,
  isDark       = false,
}) => {
  const surfaceHi = isDark ? '#273549' : '#f8fafc';
  const textPri   = isDark ? '#f1f5f9' : '#0f172a';
  const textSec   = isDark ? '#94a3b8' : '#64748b';

  const defaultPressedBg = pressedBg ?? surfaceHi;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        flexDirection:  'row',
        alignItems:     'center',
        gap:            12,
        paddingHorizontal: 14,
        paddingVertical:   13,
        backgroundColor: pressed ? defaultPressedBg : 'transparent',
        opacity: (disabled || loading) ? busyOpacity : 1,
      })}
    >
      {/* Circle badge */}
      <View style={{
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
      }}>
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : badgeContent
        }
      </View>

      {/* Labels */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: textPri }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={{ fontSize: 11, color: textSec, marginTop: 1 }}>
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
