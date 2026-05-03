import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontSize, FontWeight } from '@/src/constants/theme';

export interface NavItemProps {
  icon:           string;
  label:          string;
  /** Text + icon color — defaults to white (designed for dark drawer backgrounds) */
  color?:         string;
  /** Show a horizontal divider above this item */
  dividerBefore?: boolean;
  onPress?:       () => void;
}

/**
 * NavItem — a single row in a navigation drawer.
 *
 * RTL: inherits direction from DirectionProvider — no manual isRtl needed.
 * Designed for dark drawer backgrounds (default color is white).
 */
const NavItem: React.FC<NavItemProps> = ({
  icon, label,
  color         = '#ffffff',
  dividerBefore = false,
  onPress,
}) => (
  <>
    {dividerBefore && <View style={styles.divider} />}
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
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
    // Semi-transparent white — designed for dark drawer backgrounds
    backgroundColor:  'rgba(255,255,255,0.2)',
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
