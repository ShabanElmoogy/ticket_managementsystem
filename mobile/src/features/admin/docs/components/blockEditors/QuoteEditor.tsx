import React from 'react';
import { View, TextInput } from 'react-native';
import type { QuoteBlock } from '../../types/types';

interface Props { block: QuoteBlock; isDark: boolean; onChange: (patch: Partial<QuoteBlock>) => void; }

const QuoteEditor: React.FC<Props> = ({ block, isDark, onChange }) => (
  <View style={{
    borderLeftWidth: 3, borderLeftColor: '#3b82f6',
    paddingLeft: 12, gap: 6,
  }}>
    <TextInput
      value={block.text}
      onChangeText={(text) => onChange({ text })}
      placeholder="Quote text…"
      placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
      multiline
      style={{
        fontSize: 15, fontStyle: 'italic',
        color: isDark ? '#e2e8f0' : '#1e293b',
        lineHeight: 22,
      }}
    />
    <TextInput
      value={block.attribution ?? ''}
      onChangeText={(attribution) => onChange({ attribution })}
      placeholder="— Attribution (optional)"
      placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
      style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}
    />
  </View>
);

export default QuoteEditor;
