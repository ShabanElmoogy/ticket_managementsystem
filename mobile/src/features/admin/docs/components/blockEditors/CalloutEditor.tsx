import React from 'react';
import { TextInput } from 'react-native';
import { CalloutBox } from '@/src/shared/components';
import ChipSelector from '@/src/shared/components/forms/ChipSelector';
import type { CalloutBlock, CalloutType } from '../../types/types';

// ── Callout type config ───────────────────────────────────────────────────────

const CALLOUT_TYPES: {
  type:    CalloutType;
  emoji:   string;
  label:   string;
  color:   string;
  bg:      string;
  darkBg:  string;
  border:  string;
}[] = [
  { type: 'info',    emoji: 'ℹ️', label: 'Info',    color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e3a5f', border: '#bfdbfe' },
  { type: 'warning', emoji: '⚠️', label: 'Warning', color: '#f59e0b', bg: '#fffbeb', darkBg: '#451a03', border: '#fde68a' },
  { type: 'success', emoji: '✅', label: 'Success', color: '#10b981', bg: '#f0fdf4', darkBg: '#052e16', border: '#bbf7d0' },
  { type: 'error',   emoji: '❌', label: 'Error',   color: '#ef4444', bg: '#fef2f2', darkBg: '#450a0a', border: '#fecaca' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  block:    CalloutBlock;
  isDark:   boolean;
  onChange: (patch: Partial<CalloutBlock>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const CalloutEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const cfg = CALLOUT_TYPES.find((c) => c.type === block.calloutType) ?? CALLOUT_TYPES[0];

  return (
    <>
      {/* Type selector */}
      <ChipSelector
        layout="tiles"
        options={CALLOUT_TYPES.map(({ type, emoji, label, color }) => ({
          value: type, icon: emoji, label, color,
        }))}
        value={block.calloutType}
        onChange={(v) => onChange({ calloutType: v as CalloutType })}
      />

      {/* Content area — CalloutBox handles stripe + icon badge + layout */}
      <CalloutBox
        color={cfg.color}
        bg={cfg.bg}
        darkBg={cfg.darkBg}
        border={cfg.border}
        emoji={cfg.emoji}
        isDark={isDark}
      >
        <TextInput
          value={block.text}
          onChangeText={(text) => onChange({ text })}
          placeholder={`${cfg.label} message…`}
          placeholderTextColor={cfg.color + '66'}
          multiline
          style={{
            fontSize: 14, lineHeight: 22,
            color: isDark ? '#e2e8f0' : '#1e293b',
            minHeight: 60,
          }}
        />
      </CalloutBox>
    </>
  );
};

export default CalloutEditor;
