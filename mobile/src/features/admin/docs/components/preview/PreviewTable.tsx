import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { TableBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: TableBlock; isDark: boolean; colors: PreviewColors; }

const PreviewTable: React.FC<Props> = ({ block, isDark, colors }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginBottom: 8 }}>
    <View>
      {/* Header row */}
      <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
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
          backgroundColor: ri % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
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

export default PreviewTable;
