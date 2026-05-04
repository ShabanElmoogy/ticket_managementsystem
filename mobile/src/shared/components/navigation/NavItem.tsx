import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontSize, FontWeight } from '@/src/constants/theme';

export interface NavItemProps {
  icon:           string;
  label:          string;
  /** Text + icon color. Pass `c.text.primary` from the parent for theme-aware color. */
  color?:         string;
  /** Divider line color. Pass `c.border.primary` from the parent for theme-aware color. */
  dividerColor?:  string;
  /** Show a horizontal divider above this item */
  dividerBefore?: boolean;
  onPress?:       () => void;
}

/**
 * NavItem — a single row in a navigation drawer.
 *
 * Modal-safe: no hooks. All colors resolved by the parent and passed as props.
 * RTL: inherits direction from the parent View's `direction` style.
 *
 * Usage:
 *   <NavItem icon="🏠" label="Home" color={c.text.primary} dividerColor={c.border.primary} onPress={...} />
 */
const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  color         = '#18181b',
  dividerColor  = 'rgba(0,0,0,0.10)',
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
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
    >
      <Text style={styles.icon} accessibilityElementsHidden>
        {icon}
      </Text>
      <Text style={[styles.label, { color }]}>
        {label}
      </Text>
    </Pressable>
  </>
);

const styles = StyleSheet.create({
  divider: {
    marginHorizontal: 16,
    marginVertical:   4,
    height:           1,
  },
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   12,
    gap:               12,
  },
  icon: {
    fontSize:  FontSize['2xl'],
    width:     24,
    textAlign: 'center',
  },
  label: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.medium,
  },
});

export default NavItem;
