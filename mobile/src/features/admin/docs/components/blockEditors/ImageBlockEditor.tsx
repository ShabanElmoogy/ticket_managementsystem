import React from 'react';
import { View, Text, TextInput, Image } from 'react-native';
import type { ImageBlock } from '../../types/types';

interface Props { block: ImageBlock; isDark: boolean; onChange: (patch: Partial<ImageBlock>) => void; }

const ImageBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => (
  <View style={{ gap: 8 }}>
    <TextInput
      value={block.url}
      onChangeText={(url) => onChange({ url })}
      placeholder="Image URL…"
      placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
      autoCapitalize="none"
      autoCorrect={false}
      style={{
        fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b',
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8,
        borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
      }}
    />
    {block.url ? (
      <Image
        source={{ uri: block.url }}
        style={{ width: '100%', height: 180, borderRadius: 8, resizeMode: 'cover' }}
        onError={() => {}}
      />
    ) : (
      <View style={{
        height: 120, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0', borderStyle: 'dashed',
      }}>
        <Text style={{ fontSize: 28 }}>🖼️</Text>
        <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#9ca3af', marginTop: 4 }}>Enter image URL above</Text>
      </View>
    )}
    <TextInput
      value={block.caption ?? ''}
      onChangeText={(caption) => onChange({ caption })}
      placeholder="Caption (optional)…"
      placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
      style={{
        fontSize: 12, color: isDark ? '#94a3b8' : '#64748b',
        textAlign: 'center', paddingVertical: 4,
      }}
    />
  </View>
);

export default ImageBlockEditor;
