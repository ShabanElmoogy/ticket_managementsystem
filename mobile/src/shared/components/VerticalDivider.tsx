import React from 'react';
import { View } from 'react-native';

interface Props {
  isDark?: boolean;
  height?: number;
  marginHorizontal?: number;
}

/**
 * Thin vertical line — used to separate button groups in headers/toolbars.
 */
const VerticalDivider: React.FC<Props> = ({
  isDark = false,
  height = 32,
  marginHorizontal = 10,
}) => (
  <View style={{
    width: 1,
    height,
    marginHorizontal,
    backgroundColor: isDark ? '#334155' : '#d1d5db',
  }} />
);

export default VerticalDivider;
