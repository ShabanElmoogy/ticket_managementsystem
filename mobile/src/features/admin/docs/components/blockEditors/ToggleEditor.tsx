import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { ToggleBlock } from '../../types/types';

interface Props { block: ToggleBlock; isDark: boolean; onChange: (patch: Partial<ToggleBlock>) => void; }

const ToggleEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0', overflow: 'hidden' }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          padding: 10, backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        }}
      >
        <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>{open ? '▼' : '▶'}</Text>
        <TextInput
          value={block.summary}
          onChangeText={(summary) => onChange({ summary })}
          placeholder="Toggle summary…"
          placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
          style={{ flex: 1, fontSize: 14, fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b' }}
          onPressIn={(e) => e.stopPropagation?.()}
        />
      </Pressable>
      {open && (
        <View style={{ padding: 10, backgroundColor: isDark ? '#0f172a' : '#fff' }}>
          <TextInput
            value={block.content}
            onChangeText={(content) => onChange({ content })}
            placeholder="Toggle content…"
            placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
            multiline
            style={{ fontSize: 14, color: isDark ? '#e2e8f0' : '#1e293b', lineHeight: 20, minHeight: 60 }}
          />
        </View>
      )}
    </View>
  );
};

export default ToggleEditor;
