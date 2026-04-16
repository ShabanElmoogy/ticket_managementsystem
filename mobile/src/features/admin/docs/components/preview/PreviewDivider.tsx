import React from 'react';
import { View } from 'react-native';
import type { DividerBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: DividerBlock; colors: PreviewColors; }

const PreviewDivider: React.FC<Props> = ({ block, colors }) => (
  <View style={{
    height: block.settings?.dividerThickness ?? 1,
    backgroundColor: block.settings?.dividerColor ?? colors.borderColor,
    marginVertical: 12,
  }} />
);

export default PreviewDivider;
