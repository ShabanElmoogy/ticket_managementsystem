import React from 'react';
import { TextInput } from 'react-native';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import { CalloutBox, CALLOUT_CONFIGS } from '@/src/shared/components';
import ChipSelector from '@/src/shared/components/forms/ChipSelector';
import type { CalloutBlock, CalloutType } from '../../types/types';

const CALLOUT_OPTIONS = (
  Object.entries(CALLOUT_CONFIGS) as [CalloutType, typeof CALLOUT_CONFIGS[keyof typeof CALLOUT_CONFIGS]][]
).map(([type, cfg]) => ({
  value: type,
  icon:  cfg.emoji,
  label: type.charAt(0).toUpperCase() + type.slice(1),
  color: cfg.color,
}));

interface Props {
  block:    CalloutBlock;
  onChange: (patch: Partial<CalloutBlock>) => void;
}

const CalloutEditor: React.FC<Props> = ({ block, onChange }) => {
  const c      = useThemeColors();
  const isDark = useIsDark();
  const cfg    = CALLOUT_CONFIGS[block.calloutType] ?? CALLOUT_CONFIGS.info;

  const bg     = isDark ? cfg.darkBg     : cfg.lightBg;
  const border = isDark ? cfg.darkBorder : cfg.lightBorder;

  return (
    <>
      <ChipSelector
        layout="tiles"
        options={CALLOUT_OPTIONS}
        value={block.calloutType}
        onChange={(v) => onChange({ calloutType: v as CalloutType })}
      />
      <CalloutBox color={cfg.color} bg={bg} border={border} emoji={cfg.emoji}>
        <TextInput
          value={block.text}
          onChangeText={(text) => onChange({ text })}
          placeholder={`${cfg.emoji} ${block.calloutType} message…`}
          placeholderTextColor={cfg.color + '66'}
          multiline
          style={{
            fontSize: 14, lineHeight: 22,
            color: c.text.primary,
            minHeight: 60,
          }}
        />
      </CalloutBox>
    </>
  );
};

export default CalloutEditor;
