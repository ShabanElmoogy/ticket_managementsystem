import React from 'react';
import { View, Text } from 'react-native';
import type { BulletedListBlock, NumberedListBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface BulletProps { block: BulletedListBlock; colors: PreviewColors; }
interface NumberedProps { block: NumberedListBlock; colors: PreviewColors; }

export const PreviewBulletedList: React.FC<BulletProps> = ({ block, colors }) => (
  <View style={{ marginBottom: 8 }}>
    {block.title ? (
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textColor, marginBottom: 4 }}>
        {block.title}
      </Text>
    ) : null}
    {block.items.map((item, i) => (
      <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 3 }}>
        <Text style={{ color: colors.mutedColor, fontSize: 16, lineHeight: 20 }}>•</Text>
        <Text style={{ flex: 1, fontSize: 14, color: colors.textColor, lineHeight: 20 }}>{item}</Text>
      </View>
    ))}
  </View>
);

export const PreviewNumberedList: React.FC<NumberedProps> = ({ block, colors }) => (
  <View style={{ marginBottom: 8 }}>
    {block.title ? (
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textColor, marginBottom: 4 }}>
        {block.title}
      </Text>
    ) : null}
    {block.items.map((item, i) => (
      <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 3 }}>
        <Text style={{ color: colors.mutedColor, fontSize: 13, width: 20, lineHeight: 20 }}>{i + 1}.</Text>
        <Text style={{ flex: 1, fontSize: 14, color: colors.textColor, lineHeight: 20 }}>{item}</Text>
      </View>
    ))}
  </View>
);
