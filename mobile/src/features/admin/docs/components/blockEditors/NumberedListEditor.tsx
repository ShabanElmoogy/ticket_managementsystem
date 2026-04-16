import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { NumberedListBlock } from '../../types/types';

interface Props { block: NumberedListBlock; isDark: boolean; onChange: (patch: Partial<NumberedListBlock>) => void; }

const NumberedListEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const updateItem = (idx: number, val: string) => {
    const items = [...block.items];
    items[idx] = val;
    onChange({ items });
  };
  const addItem = () => onChange({ items: [...block.items, ''] });
  const removeItem = (idx: number) => {
    if (block.items.length <= 1) return;
    onChange({ items: block.items.filter((_, i) => i !== idx) });
  };

  return (
    <View style={{ gap: 4 }}>
      <TextInput
        value={block.title ?? ''}
        onChangeText={(title) => onChange({ title })}
        placeholder="List title (optional)…"
        placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
        style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b', paddingVertical: 2 }}
      />
      {block.items.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', width: 20 }}>{idx + 1}.</Text>
          <TextInput
            value={item}
            onChangeText={(v) => updateItem(idx, v)}
            placeholder="List item…"
            placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
            style={{ flex: 1, fontSize: 14, color: isDark ? '#e2e8f0' : '#1e293b', paddingVertical: 3 }}
          />
          <Pressable onPress={() => removeItem(idx)} hitSlop={6}>
            <Text style={{ fontSize: 14, color: '#ef4444' }}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addItem} style={{ paddingVertical: 4 }}>
        <Text style={{ fontSize: 13, color: '#3b82f6' }}>+ Add item</Text>
      </Pressable>
    </View>
  );
};

export default NumberedListEditor;
