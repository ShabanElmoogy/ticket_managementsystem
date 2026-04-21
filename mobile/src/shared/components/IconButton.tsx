import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';

export interface IconButtonProps {
  /** Icon emoji or text */
  icon: string;
  /** Icon size */
  iconSize?: number;
  /** Button size (width and height) */
  size?: number;
  /** Background color */
  backgroundColor?: string;
  /** Icon color */
  iconColor?: string;
  /** Badge count (shows red badge with number) */
  badgeCount?: number;
  /** Badge background color */
  badgeColor?: string;
  /** On press handler */
  onPress?: () => void;
  /** Custom container style */
  style?: ViewStyle;
}

/**
 * IconButton component - circular button with icon and optional badge
 * Used for notification bell, hamburger menu, etc.
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  iconSize = 16,
  size = 36,
  backgroundColor = 'rgba(255,255,255,0.1)',
  iconColor = '#fff',
  badgeCount,
  badgeColor = '#ef4444',
  onPress,
  style,
}) => {
  return (
    <Pressable
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
      onPress={onPress}
    >
      <Text style={{ fontSize: iconSize, color: iconColor }}>{icon}</Text>
      {badgeCount !== undefined && badgeCount > 0 && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor,
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default IconButton;
