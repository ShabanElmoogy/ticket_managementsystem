import React from 'react';
import { TextInput } from 'react-native';
import type { HeadingBlock } from '../../types/types';

interface Props {
  block: HeadingBlock;
  isDark: boolean;
  onChange: (patch: Partial<HeadingBlock>) => void;
}

const HeadingBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => (
  <TextInput
    value={block.text}
    onChangeText={(text) => onChange({ text })}
    placeholder="Heading…"
    placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
    multiline
    style={{
      fontSize: 22,
      fontWeight: '700',
      color: block.settings?.color ?? (isDark ? '#f1f5f9' : '#0f172a'),
      textAlign: block.settings?.align ?? 'left',
      paddingVertical: 4,
      paddingHorizontal: 0,
    }}
  />
);

export default HeadingBlockEditor;
