import React from 'react';
import { TextInput } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { CalloutBox, CALLOUT_CONFIGS } from '@/src/shared/components';
import ChipSelector from '@/src/shared/components/forms/ChipSelector';
import type { CalloutBlock, CalloutType } from '../../types/types';

// ── Callout type selector options ─────────────────────────────────────────────
// Derived from CALLOUT_CONFIGS — single source of truth for colors and emojis.

const CALLOUT_OPTIONS = (
  Object.entries(CALLOUT_CONFIGS) as [CalloutType, typeof CALLOUT_CONFIGS[keyof typeof CALLOUT_CONFIGS]][]
).map(([type, cfg]) => ({
  value: type,
  icon:  cfg.emoji,
  label: type.charAt(0).toUpperCase() + type.slice(1), // "info" → "Info"
  color: cfg.color,
}));

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  block:    CalloutBlock;
  isDark:   boolean;
  onChange: (patch: Partial<CalloutBlock>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const CalloutEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const c   = useThemeColors();
  const cfg = CALLOUT_CONFIGS[block.calloutType] ?? CALLOUT_CONFIGS.info;

  // Resolve colors for the current color scheme
  const bg     = isDark ? cfg.darkBg     : cfg.lightBg;
  const border = isDark ? cfg.darkBorder : cfg.lightBorder;

  return (
    <>
      {/* Type selector */}
      <ChipSelector
        layout="tiles"
        options={CALLOUT_OPTIONS}
        value={block.calloutType}
        onChange={(v) => onChange({ calloutType: v as CalloutType })}
      />

      {/* Content area — CalloutBox handles stripe + icon badge + layout */}
      <CalloutBox
        color={cfg.color}
        bg={bg}
        border={border}
        emoji={cfg.emoji}
      >
        <TextInput
          value={block.text}
          onChangeText={(text) => onChange({ text })}
          placeholder={`${cfg.emoji} ${block.calloutType} message…`}
          placeholderTextColor={cfg.color + '66'}
          multiline
          style={{
            fontSize:   14,
            lineHeight: 22,
            color:      c.text.primary,
            minHeight:  60,
          }}
        />
      </CalloutBox>
    </>
  );
};

export default CalloutEditor;
