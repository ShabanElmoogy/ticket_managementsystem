import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { NumberedListBlock } from '../../types/types';

interface Props { block: NumberedListBlock; isDark: boolean; onChange: (patch: Partial<NumberedListBlock>) => void; }

const NUM_COLOR = '#10b981';

const NumberedListEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const updateItem = (idx: number, val: string) => {
    const items = [...block.items]; items[idx] = val; onChange({ items });
  };
  const addItem = (afterIdx?: number) => {
    const items = [...block.items];
    const insertAt = afterIdx !== undefined ? afterIdx + 1 : items.length;
    items.splice(insertAt, 0, '');
    onChange({ items });
    setTimeout(() => inputRefs.current[insertAt]?.focus(), 50);
  };
  const removeItem = (idx: number) => {
    if (block.items.length <= 1) return;
    onChange({ items: block.items.filter((_, i) => i !== idx) });
    setTimeout(() => inputRefs.current[Math.max(0, idx - 1)]?.focus(), 50);
  };

  return (
    <View style={{ gap: 6 }}>
      {/* Title */}
      <TextInput
        value={block.title ?? ''}
        onChangeText={(title) => onChange({ title })}
        placeholder="List title (optional)…"
        placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
        style={{
          fontSize: 14, fontWeight: '700',
          color: isDark ? '#e2e8f0' : '#1e293b',
          paddingBottom: 6,
          borderBottomWidth: 1, borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
          marginBottom: 2,
        }}
      />

      {/* Items */}
      {block.items.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Number badge */}
          <View style={{
            width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
            backgroundColor: NUM_COLOR + '20', flexShrink: 0,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: NUM_COLOR }}>{idx + 1}</Text>
          </View>

          <TextInput
            ref={(r) => { inputRefs.current[idx] = r; }}
            value={item}
            onChangeText={(v) => updateItem(idx, v)}
            placeholder={`Item ${idx + 1}…`}
            placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
            onSubmitEditing={() => addItem(idx)}
            blurOnSubmit={false}
            style={{
              flex: 1, fontSize: 14, lineHeight: 20,
              color: isDark ? '#e2e8f0' : '#1e293b',
              paddingVertical: 6,
            }}
          />

          <Pressable
            onPress={() => removeItem(idx)}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? '#fef2f2' : 'transparent',
            })}
          >
            <Text style={{ fontSize: 13, color: '#ef4444' }}>✕</Text>
          </Pressable>
        </View>
      ))}

      {/* Add item */}
      <Pressable
        onPress={() => addItem()}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, marginTop: 2,
          backgroundColor: pressed ? NUM_COLOR + '10' : 'transparent',
        })}
      >
        <View style={{
          width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
          backgroundColor: NUM_COLOR + '20',
        }}>
          <Text style={{ fontSize: 14, color: NUM_COLOR, lineHeight: 16 }}>+</Text>
        </View>
        <Text style={{ fontSize: 13, color: NUM_COLOR, fontWeight: '600' }}>Add item</Text>
      </Pressable>
    </View>
  );
};

export default NumberedListEditor;
