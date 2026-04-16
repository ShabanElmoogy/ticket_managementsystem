import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { CalloutBlock, CalloutType } from '../../types/types';

const CALLOUT_TYPES: {
  type: CalloutType; emoji: string; label: string;
  color: string; bg: string; darkBg: string; border: string;
}[] = [
  { type: 'info',    emoji: 'ℹ️', label: 'Info',    color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e3a5f', border: '#bfdbfe' },
  { type: 'warning', emoji: '⚠️', label: 'Warning', color: '#f59e0b', bg: '#fffbeb', darkBg: '#451a03', border: '#fde68a' },
  { type: 'success', emoji: '✅', label: 'Success', color: '#10b981', bg: '#f0fdf4', darkBg: '#052e16', border: '#bbf7d0' },
  { type: 'error',   emoji: '❌', label: 'Error',   color: '#ef4444', bg: '#fef2f2', darkBg: '#450a0a', border: '#fecaca' },
];

interface Props { block: CalloutBlock; isDark: boolean; onChange: (patch: Partial<CalloutBlock>) => void; }

const CalloutEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const cfg = CALLOUT_TYPES.find((c) => c.type === block.calloutType) ?? CALLOUT_TYPES[0];

  return (
    <View style={{ gap: 10 }}>
      {/* Type selector */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {CALLOUT_TYPES.map((c) => {
          const active = block.calloutType === c.type;
          return (
            <Pressable
              key={c.type}
              onPress={() => onChange({ calloutType: c.type })}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10,
                backgroundColor: active ? c.color : (isDark ? '#1e293b' : '#f8fafc'),
                borderWidth: 1.5,
                borderColor: active ? c.color : (isDark ? '#334155' : '#e2e8f0'),
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 2 }}>{c.emoji}</Text>
              <Text style={{
                fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
                color: active ? '#fff' : (isDark ? '#64748b' : '#94a3b8'),
              }}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content area */}
      <View style={{
        borderRadius: 12, overflow: 'hidden',
        borderWidth: 1.5, borderColor: isDark ? cfg.color + '55' : cfg.border,
        backgroundColor: isDark ? cfg.darkBg : cfg.bg,
      }}>
        {/* Colored top stripe */}
        <View style={{ height: 3, backgroundColor: cfg.color }} />

        <View style={{ flexDirection: 'row', gap: 12, padding: 14 }}>
          {/* Emoji */}
          <View style={{
            width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: cfg.color + '22', flexShrink: 0,
          }}>
            <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
          </View>

          {/* Text */}
          <TextInput
            value={block.text}
            onChangeText={(text) => onChange({ text })}
            placeholder={`${cfg.label} message…`}
            placeholderTextColor={cfg.color + '66'}
            multiline
            style={{
              flex: 1, fontSize: 14, lineHeight: 22,
              color: isDark ? '#e2e8f0' : '#1e293b',
              minHeight: 60,
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default CalloutEditor;
