import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { FontSize } from '@/src/constants/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface IconButtonProps {
  /** Ionicons icon name */
  icon:               IoniconName;
  /** Accessible label for screen readers — required */
  accessibilityLabel: string;
  iconSize?:          number;
  size?:              number;
  backgroundColor?:   string;
  iconColor?:         string;
  /** Badge count shown top-right. Hidden when 0 or undefined. */
  badgeCount?:        number;
  badgeColor?:        string;
  onPress?:           () => void;
  style?:             ViewStyle;
}

/**
 * IconButton — circular icon button with optional notification badge.
 *
 * Modal-safe: no hooks. Pass colors explicitly.
 *
 * @example
 * <IconButton
 *   icon="notifications-outline"
 *   accessibilityLabel={t('nav.notifications')}
 *   badgeCount={unreadCount}
 *   iconColor={c.text.inverse}
 *   backgroundColor="rgba(255,255,255,0.15)"
 *   onPress={openNotifications}
 * />
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  accessibilityLabel,
  iconSize        = 20,
  size            = 36,
  backgroundColor = 'rgba(255,255,255,0.15)',
  iconColor       = '#ffffff',
  badgeCount,
  badgeColor      = '#ef4444',
  onPress,
  style,
}) => {
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
      <Ionicons
        name={icon}
        size={iconSize}
        color={iconColor}
        accessibilityElementsHidden
      />

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
    position:     'absolute',
    top:          -2,
    right:        -2,
    minWidth:     16,
    height:       16,
    borderRadius: 8,
    alignItems:   'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color:      '#ffffff',
    fontSize:   FontSize.xs,
    fontWeight: '700',
  },
});

export default IconButton;
