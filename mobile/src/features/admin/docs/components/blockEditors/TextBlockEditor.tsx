import React from 'react';
import { TextInput, View, Text, Pressable, ScrollView } from 'react-native';
import type { TextBlock } from '../../types/types';

// Mobile: no Tiptap — use plain TextInput. Store as plain text in html field.
// The html field will contain plain text on mobile (no HTML tags).

interface Props {
  block: TextBlock;
  isDark: boolean;
  onChange: (patch: Partial<TextBlock>) => void;
}

// Strip basic HTML tags for display in TextInput
function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

const TextBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const plain = htmlToPlain(block.html);

  return (
    <TextInput
      value={plain}
      onChangeText={(text) => onChange({ html: text })}
      placeholder="Start typing…"
      placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
      multiline
      style={{
        fontSize: 14,
        lineHeight: 22,
        color: block.settings?.color ?? (isDark ? '#e2e8f0' : '#1e293b'),
        textAlign: block.settings?.align ?? 'left',
        paddingVertical: 4,
        minHeight: 40,
      }}
    />
  );
};

export default TextBlockEditor;
