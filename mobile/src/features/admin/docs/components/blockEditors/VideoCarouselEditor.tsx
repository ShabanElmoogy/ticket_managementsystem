import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { VideoCarouselBlock, VideoItem } from '../../types/types';
import { newId } from '../../utils/idUtils';

interface Props { block: VideoCarouselBlock; isDark: boolean; onChange: (patch: Partial<VideoCarouselBlock>) => void; }

const CAROUSEL_COLOR = '#ef4444';

const VideoCarouselEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const updateVideo = (idx: number, patch: Partial<VideoItem>) => {
    onChange({ videos: block.videos.map((v, i) => (i === idx ? { ...v, ...patch } : v)) });
  };
  const addVideo = () => onChange({ videos: [...block.videos, { id: newId(), title: '', url: '' }] });
  const removeVideo = (idx: number) => onChange({ videos: block.videos.filter((_, i) => i !== idx) });

  const inputStyle = (isDark: boolean) => ({
    flex: 1, fontSize: 13,
    color: isDark ? '#e2e8f0' : '#1e293b',
    paddingVertical: 8, paddingHorizontal: 10,
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    borderRadius: 8, borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  });

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          backgroundColor: CAROUSEL_COLOR + '18',
        }}>
          <Text style={{ fontSize: 20 }}>🎬</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
            Video Carousel
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8' }}>
            {block.videos.length} video{block.videos.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Video list */}
      {block.videos.length === 0 ? (
        <View style={{
          height: 80, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#1e293b' : '#fef2f2',
          borderWidth: 2, borderColor: isDark ? '#334155' : '#fecaca', borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#fca5a5' }}>No videos yet — tap "Add Video" below</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {block.videos.map((video, idx) => (
            <View key={video.id} style={{
              borderRadius: 10, overflow: 'hidden',
              borderWidth: 1.5, borderColor: isDark ? '#334155' : '#fecaca',
              backgroundColor: isDark ? '#1e293b' : '#fff',
            }}>
              {/* Video header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingHorizontal: 12, paddingVertical: 8,
                backgroundColor: isDark ? '#0f172a' : '#fef2f2',
              }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: CAROUSEL_COLOR,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{idx + 1}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {video.title || `Video ${idx + 1}`}
                </Text>
                <Pressable
                  onPress={() => removeVideo(idx)}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: pressed ? '#fef2f2' : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 12, color: '#ef4444' }}>✕</Text>
                </Pressable>
              </View>

              {/* Fields */}
              <View style={{ padding: 10, gap: 6 }}>
                <TextInput
                  value={video.title}
                  onChangeText={(title) => updateVideo(idx, { title })}
                  placeholder="Video title…"
                  placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
                  style={inputStyle(isDark)}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13, color: isDark ? '#475569' : '#94a3b8' }}>🔗</Text>
                  <TextInput
                    value={video.url}
                    onChangeText={(url) => updateVideo(idx, { url })}
                    placeholder="Video URL…"
                    placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[inputStyle(isDark), { flex: 1 }]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add button */}
      <Pressable
        onPress={addVideo}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          paddingVertical: 10, borderRadius: 10,
          backgroundColor: pressed ? CAROUSEL_COLOR + '22' : CAROUSEL_COLOR + '12',
          borderWidth: 1.5, borderColor: CAROUSEL_COLOR + '44',
        })}
      >
        <Text style={{ fontSize: 16 }}>🎬</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: CAROUSEL_COLOR }}>Add Video</Text>
      </Pressable>
    </View>
  );
};

export default VideoCarouselEditor;
