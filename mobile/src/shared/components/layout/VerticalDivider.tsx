import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

interface Props {
  /** @deprecated — component reads theme internally via useThemeColors() */
  isDark?:           boolean;
  height?:           number;
  marginHorizontal?: number;
}

const VerticalDivider: React.FC<Props> = ({
  height = 32, marginHorizontal = 10,
}) => {
  const c = useThemeColors();
  return (
    <View style={{ width: 1, height, marginHorizontal, backgroundColor: c.border.secondary }} />
  );
};

export default VerticalDivider;
