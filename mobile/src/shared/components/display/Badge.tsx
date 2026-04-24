import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors, FontWeight } from '../../../constants/theme';

export interface BadgeProps {
  label:            string;
  backgroundColor?: string;
  textColor?:       string;
  fontSize?:        number;
  style?:           ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label, backgroundColor = 'rgba(16,185,129,0.27)',
  textColor, fontSize = 11, style,
}) => {
  const c  = useThemeColors();
  const fg = textColor ?? c.text.inverse;
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Text style={[styles.text, { color: fg, fontSize }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  text:      { fontWeight: FontWeight.medium },
});

export default Badge;
