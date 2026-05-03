import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { FontSize } from '@/src/constants/theme';

export interface IconButtonProps {
  /** Emoji or text icon to display */
  icon:             string;
  /** Accessible label for screen readers — required for meaningful accessibility */
  accessibilityLabel: string;
  iconSize?:        number;
  size?:            number;
  /**
   * Background color of the button circle.
   * Defaults to a semi-transparent white — suitable for dark backgrounds only.
   * Pass an explicit color when used on light backgrounds.
   */
  backgroundColor?: string;
  iconColor?:       string;
  /** Badge count shown in the top-right corner. Hidden when 0 or undefined. */
  badgeCount?:      number;
  badgeColor?:      string;
  onPress?:         () => void;
  style?:           ViewStyle;
}

/**
 * IconButton — circular icon button with optional notification badge.
 *
 * Dumb component — no theme hooks. Pass colors explicitly.
 * Safe to use inside a <Modal>.
 *
 * @example
 * <IconButton
 *   icon="🔔"
 *   accessibilityLabel={t('nav.notifications')}
 *   badgeCount={unreadCount}
 *   onPress={openNotifications}
 *   backgroundColor={c.surface.secondary}
 *   iconColor={c.text.primary}
 * />
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  accessibilityLabel,
  iconSize        = 16,
  size            = 36,
  backgroundColor = 'rgba(255,255,255,0.1)',
  iconColor       = '#ffffff',
  badgeCount,
  badgeColor      = '#ef4444',
  onPress,
  style,
}) => {
  // Build a descriptive label that includes badge count for screen readers
  const a11yLabel = badgeCount && badgeCount > 0
    ? `${accessibilityLabel}, ${badgeCount > 9 ? '9+' : badgeCount}`
    : accessibilityLabel;

  return (
    <Pressable
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <Text style={{ fontSize: iconSize, color: iconColor }} accessibilityElementsHidden>
        {icon}
      </Text>

      {badgeCount !== undefined && badgeCount > 0 && (
        <View
          style={[styles.badge, { backgroundColor: badgeColor }]}
          accessibilityElementsHidden
        >
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  badge: {
    position:       'absolute',
    top:            -2,
    right:          -2,
    width:          16,
    height:         16,
    borderRadius:   8,
    alignItems:     'center',
    justifyContent: 'center',
  },
  badgeText: {
    color:      '#ffffff',
    fontSize:   FontSize.xs,
    fontWeight: '700',
  },
});

export default IconButton;
