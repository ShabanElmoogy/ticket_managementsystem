import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { ToggleBlock } from '../../types/types';

interface Props { block: ToggleBlock; isDark: boolean; onChange: (patch: Partial<ToggleBlock>) => void; }

const TOGGLE_COLOR = '#64748b';

const ToggleEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={{
      borderRadius: 12, overflow: 'hidden',
      borderWidth: 1.5, borderColor: isDark ? '#334155' : '#e2e8f0',
    }}>
      {/* Summary row */}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 14, paddingVertical: 12,
          backgroundColor: pressed
            ? (isDark ? '#334155' : '#f1f5f9')
            : (isDark ? '#1e293b' : '#f8fafc'),
        })}
      >
        {/* Arrow */}
        <View style={{
          width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
          backgroundColor: TOGGLE_COLOR + '20',
        }}>
          <Text style={{ fontSize: 10, color: TOGGLE_COLOR, fontWeight: '700' }}>
            {open ? '▼' : '▶'}
          </Text>
        </View>

        {/* Summary input */}
        <TextInput
          value={block.summary}
          onChangeText={(summary) => onChange({ summary })}
          placeholder="Toggle title…"
          placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
          style={{
            flex: 1, fontSize: 15, fontWeight: '600',
            color: isDark ? '#e2e8f0' : '#1e293b',
          }}
        />

        {/* Open/close hint */}
        <Text style={{ fontSize: 10, color: isDark ? '#475569' : '#94a3b8' }}>
          {open ? 'Collapse' : 'Expand'}
        </Text>
      </Pressable>

      {/* Content */}
      {open && (
        <View style={{
          borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#f1f5f9',
          backgroundColor: isDark ? '#0f172a' : '#fff',
          padding: 14,
        }}>
          <TextInput
            value={block.content}
            onChangeText={(content) => onChange({ content })}
            placeholder="Toggle content goes here…"
            placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
            multiline
            autoFocus
            style={{
              fontSize: 14, lineHeight: 22,
              color: isDark ? '#e2e8f0' : '#1e293b',
              minHeight: 80,
            }}
          />
        </View>
      )}
    </View>
  );
};

export default ToggleEditor;
