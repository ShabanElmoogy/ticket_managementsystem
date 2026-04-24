import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontSize, FontWeight } from '../../../constants/theme';

export interface NavItemProps {
  icon:           string;
  label:          string;
  color?:         string;
  isRtl?:         boolean;
  dividerBefore?: boolean;
  onPress?:       () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  color         = '#ffffff',
  isRtl         = false,
  dividerBefore = false,
  onPress,
}) => (
  <>
    {dividerBefore && <View style={styles.divider} />}
    <Pressable
      style={[styles.container, { justifyContent: isRtl ? 'flex-end' : 'flex-start' }]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </Pressable>
  </>
);

const styles = StyleSheet.create({
  divider: {
    marginHorizontal: 16,
    marginVertical:   4,
    height:           1,
    backgroundColor:  'rgba(255,255,255,0.2)',
  },
  container: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 16,
    paddingVertical:  12,
  },
  content: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'flex-start',
    width:          '100%',
    gap:            12,
  },
  icon: {
    fontSize:  FontSize['2xl'],
    width:     24,
    textAlign: 'right',
  },
  label: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.medium,
  },
});

export default NavItem;
