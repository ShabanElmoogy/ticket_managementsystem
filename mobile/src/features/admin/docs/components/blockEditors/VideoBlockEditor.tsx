import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { VideoBlock } from '../../types/types';

interface Props { block: VideoBlock; isDark: boolean; onChange: (patch: Partial<VideoBlock>) => void; }

const VideoBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const isYouTube = block.url.includes('youtube.com') || block.url.includes('youtu.be');

  return (
    <View style={{ gap: 12 }}>
      {/* URL input */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderRadius: 10, borderWidth: 1.5, borderColor: isDark ? '#334155' : '#e2e8f0',
        paddingHorizontal: 12, paddingVertical: 2,
      }}>
        <Text style={{ fontSize: 16 }}>🔗</Text>
        <TextInput
          value={block.url}
          onChangeText={(url) => onChange({ url })}
          placeholder="YouTube or direct video URL…"
          placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b', paddingVertical: 10 }}
        />
        {block.url ? (
          <Pressable onPress={() => onChange({ url: '' })} hitSlop={6}>
            <Text style={{ fontSize: 14, color: '#ef4444' }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Preview placeholder */}
      <View style={{
        height: 160, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: block.url
          ? (isDark ? '#1e293b' : '#fef2f2')
          : (isDark ? '#1e293b' : '#fef2f2'),
        borderWidth: 2,
        borderColor: block.url ? '#ef444455' : (isDark ? '#334155' : '#fecaca'),
        borderStyle: block.url ? 'solid' : 'dashed',
      }}>
        <View style={{
          width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
          backgroundColor: block.url ? '#ef4444' : (isDark ? '#334155' : '#fecaca'),
        }}>
          <Text style={{ fontSize: 24 }}>▶</Text>
        </View>
        {block.url ? (
          <>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>
              {isYouTube ? '▶ YouTube Video' : '▶ Video'}
            </Text>
            <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#fca5a5', textAlign: 'center', paddingHorizontal: 16 }} numberOfLines={1}>
              {block.url}
            </Text>
            <View style={{
              paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6,
              backgroundColor: isDark ? '#334155' : '#fee2e2',
            }}>
              <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#ef4444', fontWeight: '600' }}>
                Plays in preview mode
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#475569' : '#fca5a5' }}>Add a video</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#334155' : '#fecaca' }}>Paste a URL above</Text>
          </>
        )}
      </View>

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

export default VideoBlockEditor;
