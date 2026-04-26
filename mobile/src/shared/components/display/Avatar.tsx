import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, FontWeight } from '@/src/constants/theme';

export interface AvatarProps {
  text:             string;
  backgroundColor?: string;
  size?:            number;
  textColor?:       string;
  fontSize?:        number;
}

const Avatar: React.FC<AvatarProps> = ({
  text, size = 32, backgroundColor, textColor, fontSize,
}) => {
  const c = useThemeColors();
  const bg   = backgroundColor ?? c.intent.success;
  const fg   = textColor       ?? c.text.inverse;
  const fs   = fontSize        ?? Math.round(size / 3);

  const getInitials = (str: string) =>
    str.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const initials = text.length > 2 ? getInitials(text) : text.toUpperCase();

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg, fontSize: fs }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text:      { fontWeight: FontWeight.bold },
});

export default Avatar;
