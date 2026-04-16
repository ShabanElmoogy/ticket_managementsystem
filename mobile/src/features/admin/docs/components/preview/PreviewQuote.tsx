import React from 'react';
import { View, Text } from 'react-native';
import type { QuoteBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: QuoteBlock; colors: PreviewColors; }

const PreviewQuote: React.FC<Props> = ({ block, colors }) => (
  <View style={{ borderLeftWidth: 3, borderLeftColor: '#3b82f6', paddingLeft: 12, marginBottom: 8 }}>
    <Text style={{ fontSize: 15, fontStyle: 'italic', color: colors.textColor, lineHeight: 22 }}>
      {block.text}
    </Text>
    {block.attribution ? (
      <Text style={{ fontSize: 12, color: colors.mutedColor, marginTop: 4 }}>— {block.attribution}</Text>
    ) : null}
  </View>
);

export default PreviewQuote;
