import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { VideoCarouselBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props {
  block: VideoCarouselBlock;
  colors: PreviewColors;
  idx: number;
  onPrev: () => void;
  onNext: () => void;
}

const PreviewVideoCarousel: React.FC<Props> = ({ block, colors, idx, onPrev, onNext }) => {
  const video = block.videos[idx];
  if (!block.videos.length) return null;

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{
        height: 100, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#1e293b', borderWidth: 1, borderColor: colors.borderColor,
      }}>
        <Text style={{ fontSize: 24 }}>🎬</Text>
        {video && (
          <Text style={{ fontSize: 13, color: colors.textColor, marginTop: 4 }}>{video.title}</Text>
        )}
      </View>
      {block.videos.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Pressable onPress={onPrev}>
            <Text style={{ fontSize: 20, color: idx === 0 ? colors.mutedColor : '#3b82f6' }}>‹</Text>
          </Pressable>
          <Text style={{ fontSize: 13, color: colors.mutedColor }}>{idx + 1} / {block.videos.length}</Text>
          <Pressable onPress={onNext}>
            <Text style={{ fontSize: 20, color: idx === block.videos.length - 1 ? colors.mutedColor : '#3b82f6' }}>›</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default PreviewVideoCarousel;
