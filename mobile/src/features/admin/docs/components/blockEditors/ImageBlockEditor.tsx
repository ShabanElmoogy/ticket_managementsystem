import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, ActivityIndicator } from 'react-native';
import type { ImageBlock } from '../../types/types';

interface Props { block: ImageBlock; isDark: boolean; onChange: (patch: Partial<ImageBlock>) => void; }

const ImageBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const inputBg    = isDark ? '#1e293b' : '#f8fafc';
  const inputBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ gap: 12 }}>
      {/* URL input */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: inputBg, borderRadius: 10,
        borderWidth: 1.5, borderColor: inputBorder,
        paddingHorizontal: 12, paddingVertical: 2,
      }}>
        <Text style={{ fontSize: 16 }}>🔗</Text>
        <TextInput
          value={block.url}
          onChangeText={(url) => { onChange({ url }); setError(false); }}
          placeholder="Paste image URL…"
          placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b', paddingVertical: 10 }}
        />
        {block.url ? (
          <Pressable onPress={() => { onChange({ url: '' }); setError(false); }} hitSlop={6}>
            <Text style={{ fontSize: 14, color: '#ef4444' }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Preview */}
      {block.url ? (
        <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          {loading && (
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
              <ActivityIndicator color="#ec4899" />
            </View>
          )}
          {error ? (
            <View style={{ height: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', gap: 6 }}>
              <Text style={{ fontSize: 28 }}>⚠️</Text>
              <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Could not load image</Text>
              <Text style={{ fontSize: 11, color: '#fca5a5' }}>Check the URL and try again</Text>
            </View>
          ) : (
            <Image
              source={{ uri: block.url }}
              style={{ width: '100%', height: 200, resizeMode: 'cover' }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          )}
        </View>
      ) : (
        <View style={{
          height: 140, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: isDark ? '#1e293b' : '#fdf2f8',
          borderWidth: 2, borderColor: isDark ? '#334155' : '#fbcfe8', borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 36 }}>🖼️</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#ec4899' }}>Add an image</Text>
          <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#f9a8d4' }}>Paste a URL in the field above</Text>
        </View>
      )}

      {/* Caption */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderTopWidth: 1, borderTopColor: isDark ? '#1e293b' : '#f1f5f9', paddingTop: 8,
      }}>
        <Text style={{ fontSize: 13, color: isDark ? '#475569' : '#94a3b8' }}>✏️</Text>
        <TextInput
          value={block.caption ?? ''}
          onChangeText={(caption) => onChange({ caption })}
          placeholder="Add a caption…"
          placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
          style={{ flex: 1, fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', fontStyle: 'italic' }}
        />
      </View>
    </View>
  );
};

export default ImageBlockEditor;
