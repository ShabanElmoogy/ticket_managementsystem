import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';

export interface ChipTitleProps {
  title:  string;
  style?: TextStyle;
}

const ChipTitle: React.FC<ChipTitleProps> = ({ title, style }) => {
  const c = useThemeColors();
  return (
    <Text style={[{ fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text.secondary, marginBottom: 8 }, style]}>
      {title}
    </Text>
  );
};

export default ChipTitle;
