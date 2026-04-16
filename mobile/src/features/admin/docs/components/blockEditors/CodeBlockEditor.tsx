import React from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import type { CodeBlock } from '../../types/types';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'csharp', 'php', 'sql', 'bash', 'json', 'html', 'css', 'xml', 'yaml', 'markdown'];

interface Props {
  block: CodeBlock;
  isDark: boolean;
  onChange: (patch: Partial<CodeBlock>) => void;
}

const CodeBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => (
  <View style={{
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  }}>
    {/* Language selector */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}
      contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, gap: 4, flexDirection: 'row' }}
    >
      {LANGUAGES.map((lang) => (
        <Text
          key={lang}
          onPress={() => onChange({ language: lang })}
          style={{
            fontSize: 11,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
            backgroundColor: block.language === lang ? '#3b82f6' : (isDark ? '#1e293b' : '#e2e8f0'),
            color: block.language === lang ? '#fff' : (isDark ? '#94a3b8' : '#475569'),
            fontWeight: '600',
            overflow: 'hidden',
          }}
        >
          {lang}
        </Text>
      ))}
    </ScrollView>

    {/* Code input */}
    <TextInput
      value={block.code}
      onChangeText={(code) => onChange({ code })}
      placeholder="// Write your code here…"
      placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
      multiline
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      style={{
        fontFamily: 'monospace',
        fontSize: 13,
        lineHeight: 20,
        color: isDark ? '#e2e8f0' : '#1e293b',
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        padding: 12,
        minHeight: 100,
      }}
    />
  </View>
);

export default CodeBlockEditor;
