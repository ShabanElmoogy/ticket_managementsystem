import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IoniconName } from '@/src/components/layout/bottom-nav/tabItems';
import { useThemeColors } from '@/src/constants/theme';

const INACTIVE_OPACITY = 0.45;

export interface BottomNavItemProps {
  icon:          IoniconName;
  activeIcon?:   IoniconName;
  label:         string;
  isActive:      boolean;
  /** Per-tab accent color — used for active icon, label, and indicator bar */
  accentColor?:  string;
  onPress?:      () => void;
}

/**
 * BottomNavItem — a single tab in the bottom navigation bar.
 *
 * Active state: filled icon in per-tab accent color + colored label + top indicator bar.
 * Inactive state: outline icon at reduced opacity in muted text color.
 *
 * @modal-safety ❌ Not Modal-safe — calls useThemeColors() internally.
 */
const BottomNavItem: React.FC<BottomNavItemProps> = ({
  icon, activeIcon, label, isActive, accentColor, onPress,
}) => {
  const c      = useThemeColors();
  const accent = accentColor ?? c.interactive.primary;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <View style={[styles.indicator, { backgroundColor: accent }]} />
      )}

      {/* Icon */}
      <Ionicons
        name={isActive ? (activeIcon ?? icon) : icon}
        size={24}
        color={isActive ? accent : c.text.secondary}
        style={{ opacity: isActive ? 1 : INACTIVE_OPACITY }}
      />

      {/* Label */}
      <Text style={[
        styles.label,
        {
          color:   isActive ? accent : c.text.secondary,
          opacity: isActive ? 1 : INACTIVE_OPACITY,
          fontWeight: isActive ? '600' : '400',
        },
      ]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             3,
    paddingVertical: 8,
  },
  indicator: {
    position:     'absolute',
    top:          0,
    alignSelf:    'center',
    width:        28,
    height:       3,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
  },
});

export default BottomNavItem;
