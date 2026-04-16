import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { CalloutBlock, CalloutType } from '../../types/types';

const CALLOUT_TYPES: { type: CalloutType; emoji: string; color: string; bg: string; darkBg: string }[] = [
  { type: 'info',    emoji: 'ℹ️', color: '#3b82f6', bg: '#eff6ff', darkBg: 'rgba(59,130,246,0.1)' },
  { type: 'warning', emoji: '⚠️', color: '#f59e0b', bg: '#fffbeb', darkBg: 'rgba(245,158,11,0.1)' },
  { type: 'success', emoji: '✅', color: '#10b981', bg: '#f0fdf4', darkBg: 'rgba(16,185,129,0.1)' },
  { type: 'error',   emoji: '❌', color: '#ef4444', bg: '#fef2f2', darkBg: 'rgba(239,68,68,0.1)' },
];

interface Props { block: CalloutBlock; isDark: boolean; onChange: (patch: Partial<CalloutBlock>) => void; }

const CalloutEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const cfg = CALLOUT_TYPES.find((c) => c.type === block.calloutType) ?? CALLOUT_TYPES[0];

  return (
    <View style={{ gap: 8 }}>
      {/* Type selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, flexDirection: 'row' }}
      >
        {CALLOUT_TYPES.map((c) => (
          <Pressable
            key={c.type}
            onPress={() => onChange({ calloutType: c.type })}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
              backgroundColor: block.calloutType === c.type ? c.color : (isDark ? '#1e293b' : '#f1f5f9'),
              borderWidth: 1,
              borderColor: block.calloutType === c.type ? c.color : (isDark ? '#334155' : '#e2e8f0'),
            }}
          >
            <Text style={{ fontSize: 13 }}>{c.emoji}</Text>
            <Text style={{
              fontSize: 12, fontWeight: '600', textTransform: 'capitalize',
              color: block.calloutType === c.type ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
            }}>
              {c.type}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={{
        flexDirection: 'row', gap: 10, padding: 12, borderRadius: 8,
        backgroundColor: isDark ? cfg.darkBg : cfg.bg,
        borderWidth: 1, borderColor: cfg.color + '44',
      }}>
        <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
        <TextInput
          value={block.text}
          onChangeText={(text) => onChange({ text })}
          placeholder="Callout text…"
          placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
          multiline
          style={{
            flex: 1, fontSize: 14, lineHeight: 20,
            color: isDark ? '#e2e8f0' : '#1e293b',
          }}
        />
      </View>
    </View>
  );
};

export default CalloutEditor;
