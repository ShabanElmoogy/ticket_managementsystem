import React from 'react';
import { Text } from 'react-native';
import type { TextBlock } from '../../types/types';
import { stripHtml, type PreviewColors } from './previewUtils';

interface Props { block: TextBlock; colors: PreviewColors; }

const PreviewText: React.FC<Props> = ({ block, colors }) => (
  <Text style={{
    fontSize: 14, lineHeight: 22,
    color: block.settings?.color ?? colors.textColor,
    textAlign: block.settings?.align ?? 'left',
    marginBottom: 8,
  }}>
    {stripHtml(block.html)}
  </Text>
);

export default PreviewText;
