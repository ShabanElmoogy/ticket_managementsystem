import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { CodeBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: CodeBlock; isDark: boolean; colors: PreviewColors; }

const PreviewCode: React.FC<Props> = ({ block, isDark, colors }) => (
  <View style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderColor }}>
    <View style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontSize: 11, color: colors.mutedColor, fontWeight: '600' }}>{block.language}</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Text style={{
        fontFamily: 'monospace', fontSize: 13, lineHeight: 20,
        color: isDark ? '#e2e8f0' : '#1e293b',
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        padding: 12,
      }}>
        {block.code}
      </Text>
    </ScrollView>
  </View>
);

export default PreviewCode;
