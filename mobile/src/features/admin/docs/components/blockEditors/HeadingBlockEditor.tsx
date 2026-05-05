import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
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

interface Props { block: HeadingBlock; onChange: (patch: Partial<HeadingBlock>) => void; }

const HeadingBlockEditor: React.FC<Props> = ({ block, onChange }) => {
  const c = useThemeColors();
  const [sizeIdx, setSizeIdx] = useState(0);
  const { size, weight } = SIZES[sizeIdx];
  const align = block.settings?.align ?? 'left';
  const color = block.settings?.color ?? c.text.primary;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Size selector */}
        <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: c.border.primary }}>
          {SIZES.map((s, i) => (
            <Pressable
              key={s.label}
              onPress={() => setSizeIdx(i)}
              style={{
                paddingHorizontal: 10, paddingVertical: 5,
                backgroundColor: sizeIdx === i ? '#6366f1' : c.surface.tertiary,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: sizeIdx === i ? '#fff' : c.text.muted }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Align */}
        <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: c.border.primary }}>
          {ALIGNS.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => onChange({ settings: { ...block.settings, align: a.key } })}
              style={{
                paddingHorizontal: 9, paddingVertical: 5,
                backgroundColor: align === a.key ? '#6366f1' : c.surface.tertiary,
              }}
            >
              <Text style={{ fontSize: 12, color: align === a.key ? '#fff' : c.text.muted }}>{a.icon}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Color row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: c.text.muted, fontWeight: '600' }}>Color:</Text>
        {COLORS.map((col) => (
          <Pressable
            key={col}
            onPress={() => onChange({ settings: { ...block.settings, color: col } })}
            style={{
              width: 22, height: 22, borderRadius: 11, backgroundColor: col,
              borderWidth: 2.5, borderColor: color === col ? '#fff' : 'transparent',
            }}
          />
        ))}
        <Pressable
          onPress={() => onChange({ settings: { ...block.settings, color: undefined } })}
          style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: c.surface.elevated }}
        >
          <Text style={{ fontSize: 10, color: c.text.muted }}>Reset</Text>
        </Pressable>
      </ScrollView>

      {/* Input */}
      <TextInput
        value={block.text}
        onChangeText={(text) => onChange({ text })}
        placeholder="Type your heading…"
        placeholderTextColor={c.border.secondary}
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
