import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { VideoCarouselBlock, VideoItem } from '../../types/types';
import { newId } from '../../utils/idUtils';

interface Props { block: VideoCarouselBlock; isDark: boolean; onChange: (patch: Partial<VideoCarouselBlock>) => void; }

const VideoCarouselEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const updateVideo = (idx: number, patch: Partial<VideoItem>) => {
    const videos = block.videos.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    onChange({ videos });
  };
  const addVideo = () => {
    onChange({ videos: [...block.videos, { id: newId(), title: '', url: '' }] });
  };
  const removeVideo = (idx: number) => {
    onChange({ videos: block.videos.filter((_, i) => i !== idx) });
  };

  const inputStyle = {
    fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b',
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
    flex: 1,
  };

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>
        🎬 Video Carousel ({block.videos.length} videos)
      </Text>
      {block.videos.map((video, idx) => (
        <View key={video.id} style={{
          padding: 10, borderRadius: 8, gap: 6,
          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
          borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af', width: 20 }}>{idx + 1}.</Text>
            <TextInput
              value={video.title}
              onChangeText={(title) => updateVideo(idx, { title })}
              placeholder="Video title…"
              placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
              style={inputStyle}
            />
            <Pressable onPress={() => removeVideo(idx)} hitSlop={6}>
              <Text style={{ fontSize: 14, color: '#ef4444' }}>✕</Text>
            </Pressable>
          </View>
          <TextInput
            value={video.url}
            onChangeText={(url) => updateVideo(idx, { url })}
            placeholder="Video URL…"
            placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
            autoCapitalize="none"
            autoCorrect={false}
            style={inputStyle}
          />
        </View>
      ))}
      <Pressable onPress={addVideo} style={{ paddingVertical: 4 }}>
        <Text style={{ fontSize: 13, color: '#3b82f6' }}>+ Add video</Text>
      </Pressable>
    </View>
  );
};

export default VideoCarouselEditor;
