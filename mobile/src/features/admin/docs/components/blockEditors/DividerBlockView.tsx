import React from 'react';
import { View } from 'react-native';
import type { DividerBlock } from '../../types/types';

interface Props { block: DividerBlock; isDark: boolean; }

const DividerBlockView: React.FC<Props> = ({ block, isDark }) => (
  <View style={{
    height: block.settings?.dividerThickness ?? 1,
    backgroundColor: block.settings?.dividerColor ?? (isDark ? '#334155' : '#e2e8f0'),
    marginVertical: 4,
    borderRadius: 1,
  }} />
);

export default DividerBlockView;
