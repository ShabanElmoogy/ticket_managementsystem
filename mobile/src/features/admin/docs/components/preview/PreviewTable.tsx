import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { TableBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: TableBlock; colors: PreviewColors; }

const PreviewTable: React.FC<Props> = ({ block, colors }) => {
  const c = useThemeColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginBottom: 8 }}>
      <View>
        {/* Header row */}
        <View style={{ flexDirection: 'row', backgroundColor: c.surface.secondary }}>
          {block.headers.map((h, i) => (
            <View key={i} style={{ minWidth: 90, padding: 8, borderWidth: 1, borderColor: colors.borderColor }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textColor }}>{h}</Text>
            </View>
          ))}
        </View>
        {/* Data rows */}
        {block.rows.map((row, ri) => (
          <View key={ri} style={{
            flexDirection: 'row',
            backgroundColor: ri % 2 === 0 ? 'transparent' : c.surface.tertiary + '40',
          }}>
            {row.map((cell, ci) => (
              <View key={ci} style={{ minWidth: 90, padding: 8, borderWidth: 1, borderColor: colors.borderColor }}>
                <Text style={{ fontSize: 12, color: colors.textColor }}>{cell}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default PreviewTable;
