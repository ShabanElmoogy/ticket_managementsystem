import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { FontSize } from '../../../constants/theme';

export interface IconButtonProps {
  icon:              string;
  iconSize?:         number;
  size?:             number;
  backgroundColor?:  string;
  iconColor?:        string;
  badgeCount?:       number;
  badgeColor?:       string;
  onPress?:          () => void;
  style?:            ViewStyle;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  iconSize        = 16,
  size            = 36,
  backgroundColor = 'rgba(255,255,255,0.1)',
  iconColor       = '#ffffff',
  badgeCount,
  badgeColor      = '#ef4444',
  onPress,
  style,
}) => (
  <Pressable
    style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor }, style]}
    onPress={onPress}
  >
    <Text style={{ fontSize: iconSize, color: iconColor }}>{icon}</Text>
    {badgeCount !== undefined && badgeCount > 0 && (
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
      </View>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  container:  { alignItems: 'center', justifyContent: 'center' },
  badge:      { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText:  { color: '#ffffff', fontSize: FontSize.xs, fontWeight: '700' },
});

export default IconButton;
