import React from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { useIsDark } from '@/src/constants/theme';
import type { CodeBlock } from '../../types/types';

const LANGUAGES = [
  { id: 'javascript', label: 'JS',   color: '#f59e0b' },
  { id: 'typescript', label: 'TS',   color: '#3b82f6' },
  { id: 'python',     label: 'PY',   color: '#10b981' },
  { id: 'java',       label: 'Java', color: '#ef4444' },
  { id: 'csharp',     label: 'C#',   color: '#8b5cf6' },
  { id: 'php',        label: 'PHP',  color: '#6366f1' },
  { id: 'sql',        label: 'SQL',  color: '#0ea5e9' },
  { id: 'bash',       label: 'Bash', color: '#64748b' },
  { id: 'json',       label: 'JSON', color: '#f59e0b' },
  { id: 'html',       label: 'HTML', color: '#ef4444' },
  { id: 'css',        label: 'CSS',  color: '#3b82f6' },
  { id: 'yaml',       label: 'YAML', color: '#10b981' },
];

interface Props { block: CodeBlock; onChange: (patch: Partial<CodeBlock>) => void; }

const CodeBlockEditor: React.FC<Props> = ({ block, onChange }) => {
  const isDark     = useIsDark();
  const activeLang = LANGUAGES.find((l) => l.id === block.language) ?? LANGUAGES[0];

  // Code editor always uses dark bg regardless of theme — it's a code terminal
  const headerBg = isDark ? '#0f172a' : '#1e293b';
  const codeBg   = isDark ? '#020617' : '#0f172a';

  return (
    <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: activeLang.color + '55' }}>
      {/* Header bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: headerBg,
      }}>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f59e0b' }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeLang.color }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: activeLang.color }}>{activeLang.label}</Text>
        </View>
        <Text style={{ fontSize: 10, color: '#475569' }}>
          {block.code.split('\n').length} lines
        </Text>
      </View>

      {/* Language selector */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: headerBg, borderBottomWidth: 1, borderBottomColor: '#334155' }}
        contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 6, gap: 5, flexDirection: 'row' }}
      >
        {LANGUAGES.map((lang) => {
          const active = block.language === lang.id;
          return (
            <Pressable
              key={lang.id}
              onPress={() => onChange({ language: lang.id })}
              style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                backgroundColor: active ? lang.color : 'transparent',
                borderWidth: 1, borderColor: active ? lang.color : '#334155',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#fff' : '#64748b' }}>
                {lang.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Code input — always dark terminal style */}
      <TextInput
        value={block.code}
        onChangeText={(code) => onChange({ code })}
        placeholder={`// ${activeLang.label} code here…`}
        placeholderTextColor="#334155"
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        style={{
          fontFamily: 'monospace',
          fontSize: 13, lineHeight: 21,
          color: '#e2e8f0',
          backgroundColor: codeBg,
          padding: 14,
          minHeight: 140,
        }}
      />

      <View style={{
        flexDirection: 'row', justifyContent: 'flex-end',
        paddingHorizontal: 12, paddingVertical: 5,
        backgroundColor: headerBg,
      }}>
        <Text style={{ fontSize: 10, color: '#334155' }}>{block.code.length} chars</Text>
      </View>
    </View>
  );
};

export default CodeBlockEditor;
