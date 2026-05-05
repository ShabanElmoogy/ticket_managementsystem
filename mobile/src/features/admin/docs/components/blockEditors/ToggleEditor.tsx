import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { ToggleBlock } from '../../types/types';

interface Props { block: ToggleBlock; onChange: (patch: Partial<ToggleBlock>) => void; }

const TOGGLE_COLOR = '#64748b';

const ToggleEditor: React.FC<Props> = ({ block, onChange }) => {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);

  return (
    <View style={{
      borderRadius: 12, overflow: 'hidden',
      borderWidth: 1.5, borderColor: c.border.primary,
    }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 14, paddingVertical: 12,
          backgroundColor: pressed ? c.surface.elevated : c.surface.tertiary,
        })}
      >
        <View style={{
          width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
          backgroundColor: TOGGLE_COLOR + '20',
        }}>
          <Text style={{ fontSize: 10, color: TOGGLE_COLOR, fontWeight: '700' }}>
            {open ? '▼' : '▶'}
          </Text>
        </View>
        <TextInput
          value={block.summary}
          onChangeText={(summary) => onChange({ summary })}
          placeholder="Toggle title…"
          placeholderTextColor={c.border.secondary}
          style={{
            flex: 1, fontSize: 15, fontWeight: '600',
            color: c.text.primary,
          }}
        />
        <Text style={{ fontSize: 10, color: c.text.muted }}>
          {open ? 'Collapse' : 'Expand'}
        </Text>
      </Pressable>

      {open && (
        <View style={{
          borderTopWidth: 1, borderTopColor: c.border.primary,
          backgroundColor: c.surface.card,
          padding: 14,
        }}>
          <TextInput
            value={block.content}
            onChangeText={(content) => onChange({ content })}
            placeholder="Toggle content goes here…"
            placeholderTextColor={c.border.secondary}
            multiline
            autoFocus
            style={{
              fontSize: 14, lineHeight: 22,
              color: c.text.primary,
              minHeight: 80,
            }}
          />
        </View>
      )}
    </View>
  );
};

export default ToggleEditor;
