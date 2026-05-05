import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useIsDark } from '@/src/constants/theme';
import type { QuoteBlock } from '../../types/types';

interface Props { block: QuoteBlock; onChange: (patch: Partial<QuoteBlock>) => void; }

const QuoteEditor: React.FC<Props> = ({ block, onChange }) => {
  const isDark = useIsDark();
  return (
    <View style={{
      borderRadius: 12, overflow: 'hidden',
      borderWidth: 1.5, borderColor: '#8b5cf655',
      backgroundColor: isDark ? '#1e1b4b' : '#f5f3ff',
    }}>
      <View style={{ height: 4, backgroundColor: '#8b5cf6' }} />
      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 48, lineHeight: 40, color: '#8b5cf6', fontWeight: '900', marginBottom: -8 }}>
          "
        </Text>
        <TextInput
          value={block.text}
          onChangeText={(text) => onChange({ text })}
          placeholder="Enter your quote…"
          placeholderTextColor={isDark ? '#4c1d95' : '#c4b5fd'}
          multiline
          style={{
            fontSize: 17, fontStyle: 'italic', lineHeight: 26,
            color: isDark ? '#ddd6fe' : '#4c1d95',
            minHeight: 60,
          }}
        />
        <View style={{ height: 1, backgroundColor: isDark ? '#4c1d95' : '#ddd6fe' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, color: '#8b5cf6' }}>—</Text>
          <TextInput
            value={block.attribution ?? ''}
            onChangeText={(attribution) => onChange({ attribution })}
            placeholder="Attribution (optional)"
            placeholderTextColor={isDark ? '#4c1d95' : '#c4b5fd'}
            style={{
              flex: 1, fontSize: 13, fontWeight: '600',
              color: isDark ? '#a78bfa' : '#7c3aed',
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default QuoteEditor;
