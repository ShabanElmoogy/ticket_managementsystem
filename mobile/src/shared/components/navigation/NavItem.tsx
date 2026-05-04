import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IoniconName } from '@/src/components/layout/header/navItems';
import { FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface NavItemProps {
  icon:           IoniconName;
  /** Badge background color behind the icon */
  iconBg:         string;
  /** Icon color rendered on top of iconBg */
  iconColor:      string;
  label:          string;
  /** Label text color — defaults to theme text color passed from parent */
  color?:         string;
  dividerColor?:  string;
  dividerBefore?: boolean;
  onPress?:       () => void;
}

/**
 * NavItem — a single row in a navigation drawer.
 *
 * Renders a colored square icon badge (like iOS Settings / modern nav drawers)
 * followed by the label text.
 *
 * Modal-safe: no hooks. All colors resolved by the parent and passed as props.
 */
const NavItem: React.FC<NavItemProps> = ({
  icon,
  iconBg,
  iconColor,
  label,
  color         = '#18181b',
  dividerColor  = 'rgba(0,0,0,0.08)',
  dividerBefore = false,
  onPress,
}) => (
  <>
    {dividerBefore && (
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
    )}
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
    >
      {/* Colored icon badge */}
      <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      {/* Label */}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  </>
);

const styles = StyleSheet.create({
  divider: {
    marginHorizontal: 16,
    marginVertical:   6,
    height:           StyleSheet.hairlineWidth,
  },
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   11,
    gap:               14,
  },
  iconBadge: {
    width:          38,
    height:         38,
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.medium,
    flex:       1,
  },
});

export default NavItem;
