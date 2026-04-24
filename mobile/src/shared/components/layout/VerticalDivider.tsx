import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '../../../constants/theme';

interface Props {
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
