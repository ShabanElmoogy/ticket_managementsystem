import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { CodeBlock } from '../../types/types';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import { usePreviewColors } from './previewUtils';

interface Props { block: CodeBlock; }

const PreviewCode: React.FC<Props> = ({ block }) => {
  const isDark = useIsDark();
  const c = useThemeColors();
  const colors = usePreviewColors();
  return (
    <View style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderColor }}>
      <View style={{ backgroundColor: c.surface.tertiary, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ fontSize: 11, color: colors.mutedColor, fontWeight: '600' }}>{block.language}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={{
          fontFamily: 'monospace', fontSize: 13, lineHeight: 20,
          color: c.text.primary,
          backgroundColor: c.surface.secondary,
          padding: 12,
        }}>
          {block.code}
        </Text>
      </ScrollView>
    </View>
  );
};

export default PreviewCode;
