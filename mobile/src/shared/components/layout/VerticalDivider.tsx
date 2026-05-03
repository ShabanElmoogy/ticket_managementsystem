import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

export interface VerticalDividerProps {
  height?:           number;
  marginHorizontal?: number;
}

/**
 * VerticalDivider — a 1px vertical line used to separate action groups in headers.
 * Purely decorative — hidden from screen readers.
 */
const VerticalDivider: React.FC<VerticalDividerProps> = ({
  height = 32, marginHorizontal = 10,
}) => {
  const c = useThemeColors();
  return (
    <View
      style={[styles.divider, { height, marginHorizontal, backgroundColor: c.border.secondary }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    width: 1,
  },
});

export default VerticalDivider;
