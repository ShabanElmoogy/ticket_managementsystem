import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

// Opacity for inactive icon — distinct from disabled (0.45)
const INACTIVE_ICON_OPACITY = 0.4;

export interface BottomNavItemProps {
  /** Icon to show when inactive */
  icon:         string;
  /** Icon to show when active — falls back to `icon` if not provided */
  activeIcon?:  string;
  /** Label shown below the icon */
  label:        string;
  /** Whether this item is currently active */
  isActive:     boolean;
  /** Active accent color — defaults to interactive.primary from theme */
  activeColor?: string;
  /** On press handler */
  onPress?:     () => void;
}

/**
 * BottomNavItem — a single tab in a bottom navigation bar.
 *
 * @usage
 *   Used in: `AppBottomNav`
 *
 * @variants
 *   - Default: emoji icon + label, inactive at 40% opacity
 *   - Active: full-opacity icon (swaps to `activeIcon` if provided) + accent-colored label
 *             + 24×2 px indicator bar pinned to the top of the hit area
 *
 * @example
 *   <BottomNavItem
 *     icon="🏠"
 *     activeIcon="🏡"
 *     label="Home"
 *     isActive={currentRoute === 'home'}
 *     onPress={() => router.push('/home')}
 *   />
 *
 * @modal-safety
 *   ❌ Not Modal-safe — calls `useThemeColors()` internally.
 *   Use only in screen/tab-bar contexts, never inside a `<Modal>` tree.
 *
 * Reusable: no dependency on routing or tab config.
 */
const BottomNavItem: React.FC<BottomNavItemProps> = ({
  icon, activeIcon, label, isActive, activeColor, onPress,
}) => {
  const c               = useThemeColors();
  const finalActiveColor = activeColor ?? c.interactive.primary;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      {/* Active indicator bar — centered at top */}
      {isActive && (
        <View style={[styles.indicator, { backgroundColor: finalActiveColor }]} />
      )}

      {/* Icon */}
      <Text style={[styles.icon, { opacity: isActive ? 1 : INACTIVE_ICON_OPACITY }]}>
        {isActive ? (activeIcon ?? icon) : icon}
      </Text>

      {/* Label */}
      <Text style={[styles.label, { color: isActive ? finalActiveColor : c.text.secondary }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
    paddingVertical: 8,
  },
  indicator: {
    position:     'absolute',
    top:          0,
    alignSelf:    'center',
    width:        24,
    height:       2,
    borderRadius: 999,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize:   12,
    fontWeight: '500',
  },
});

export default BottomNavItem;
