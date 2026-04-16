import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { HeadingBlock } from '../../types/types';

const SIZES = [
  { label: 'H1', size: 28, weight: '800' as const },
  { label: 'H2', size: 22, weight: '700' as const },
  { label: 'H3', size: 18, weight: '600' as const },
];

const COLORS = ['#0f172a','#1e40af','#7c3aed','#be185d','#b45309','#065f46','#ef4444','#f59e0b'];
const ALIGNS: Array<{ key: 'left'|'center'|'right'; icon: string }> = [
  { key: 'left',   icon: '⬅' },
  { key: 'center', icon: '↔' },
  { key: 'right',  icon: '➡' },
];

interface Props { block: HeadingBlock; isDark: boolean; onChange: (patch: Partial<HeadingBlock>) => void; }

const HeadingBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [sizeIdx, setSizeIdx] = useState(0);
  const { size, weight } = SIZES[sizeIdx];
  const align = block.settings?.align ?? 'left';
  const color = block.settings?.color ?? (isDark ? '#f1f5f9' : '#0f172a');

  return (
    <View style={{ gap: 10 }}>
      {/* Toolbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Size selector */}
        <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          {SIZES.map((s, i) => (
            <Pressable
              key={s.label}
              onPress={() => setSizeIdx(i)}
              style={{
                paddingHorizontal: 10, paddingVertical: 5,
                backgroundColor: sizeIdx === i ? '#6366f1' : (isDark ? '#1e293b' : '#f8fafc'),
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: sizeIdx === i ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Align */}
        <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          {ALIGNS.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => onChange({ settings: { ...block.settings, align: a.key } })}
              style={{
                paddingHorizontal: 9, paddingVertical: 5,
                backgroundColor: align === a.key ? '#6366f1' : (isDark ? '#1e293b' : '#f8fafc'),
              }}
            >
              <Text style={{ fontSize: 12, color: align === a.key ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }}>{a.icon}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Color row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8', fontWeight: '600' }}>Color:</Text>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange({ settings: { ...block.settings, color: c } })}
            style={{
              width: 22, height: 22, borderRadius: 11, backgroundColor: c,
              borderWidth: 2.5, borderColor: color === c ? '#fff' : 'transparent',
              shadowColor: color === c ? c : 'transparent',
              shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
            }}
          />
        ))}
        {/* Reset */}
        <Pressable
          onPress={() => onChange({ settings: { ...block.settings, color: undefined } })}
          style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: isDark ? '#334155' : '#f1f5f9' }}
        >
          <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>Reset</Text>
        </Pressable>
      </ScrollView>

      {/* Input */}
      <TextInput
        value={block.text}
        onChangeText={(text) => onChange({ text })}
        placeholder="Type your heading…"
        placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
        multiline
        style={{
          fontSize: size, fontWeight: weight,
          color,
          textAlign: align,
          paddingVertical: 6,
          lineHeight: size * 1.3,
          minHeight: size * 1.6,
        }}
      />
    </View>
  );
};

export default HeadingBlockEditor;
