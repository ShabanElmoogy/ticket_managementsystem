import React from 'react';
import { Text } from 'react-native';
import type { HeadingBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: HeadingBlock; colors: PreviewColors; }

const SIZES: Record<string, number> = { h1: 26, h2: 22, h3: 18 };

const PreviewHeading: React.FC<Props> = ({ block, colors }) => (
  <Text style={{
    fontSize: SIZES[block.settings?.level ?? 'h2'] ?? 22,
    fontWeight: '700',
    color: block.settings?.color ?? colors.textColor,
    textAlign: block.settings?.align ?? 'left',
    marginBottom: 8,
  }}>
    {block.text}
  </Text>
);

export default PreviewHeading;
