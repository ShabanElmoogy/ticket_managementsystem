import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { TextBlock } from '../../types/types';

const ALIGNS: Array<{ key: 'left'|'center'|'right'; icon: string }> = [
  { key: 'left',   icon: '⬅' },
  { key: 'center', icon: '↔' },
  { key: 'right',  icon: '➡' },
];
const TEXT_COLORS = ['#1e293b','#1e40af','#7c3aed','#be185d','#065f46','#b45309','#ef4444','#64748b'];

function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
}

interface Props { block: TextBlock; isDark: boolean; onChange: (patch: Partial<TextBlock>) => void; }

const TextBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const align = block.settings?.align ?? 'left';
  const color = block.settings?.color ?? (isDark ? '#e2e8f0' : '#1e293b');
  const plain = htmlToPlain(block.html);

  return (
    <View style={{ gap: 10 }}>
      {/* Toolbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Align */}
        <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          {ALIGNS.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => onChange({ settings: { ...block.settings, align: a.key } })}
              style={{
                paddingHorizontal: 9, paddingVertical: 5,
                backgroundColor: align === a.key ? '#3b82f6' : (isDark ? '#1e293b' : '#f8fafc'),
              }}
            >
              <Text style={{ fontSize: 12, color: align === a.key ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }}>{a.icon}</Text>
            </Pressable>
          ))}
        </View>

        {/* Color dots */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5, flexDirection: 'row', alignItems: 'center' }}>
          {TEXT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => onChange({ settings: { ...block.settings, color: c } })}
              style={{
                width: 20, height: 20, borderRadius: 10, backgroundColor: c,
                borderWidth: 2, borderColor: color === c ? '#fff' : 'transparent',
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Text area */}
      <View style={{
        borderRadius: 10, borderWidth: 1.5,
        borderColor: isDark ? '#334155' : '#e2e8f0',
        backgroundColor: isDark ? '#0f172a' : '#fafafa',
        padding: 12,
      }}>
        <TextInput
          value={plain}
          onChangeText={(text) => onChange({ html: text })}
          placeholder="Start typing your paragraph…"
          placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
          multiline
          style={{
            fontSize: 15, lineHeight: 24,
            color,
            textAlign: align,
            minHeight: 80,
          }}
        />
      </View>

      {/* Char count */}
      <Text style={{ fontSize: 10, color: isDark ? '#334155' : '#cbd5e1', textAlign: 'right' }}>
        {plain.length} chars
      </Text>
    </View>
  );
};

export default TextBlockEditor;
