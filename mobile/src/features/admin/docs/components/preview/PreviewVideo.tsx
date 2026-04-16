import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import type { VideoBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: VideoBlock; isDark: boolean; colors: PreviewColors; }

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const PreviewVideo: React.FC<Props> = ({ block, isDark, colors }) => {
  const [playing, setPlaying] = useState(false);
  const { width } = useWindowDimensions();
  const playerWidth  = width - 64;
  const playerHeight = Math.round(playerWidth * 9 / 16);
  const youtubeId    = block.url ? getYouTubeId(block.url) : null;

  return (
    <View style={{ marginBottom: 12 }}>
      {youtubeId ? (
        playing ? (
          <View style={{ width: playerWidth, height: playerHeight, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
            <WebView
              source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}body{background:#000;width:100vw;height:100vh}iframe{width:100%;height:100%;border:none}</style></head><body><iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen></iframe></body></html>` }}
              style={{ width: playerWidth, height: playerHeight }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              originWhitelist={['*']}
            />
          </View>
        ) : (
          <Pressable
            onPress={() => setPlaying(true)}
            style={{ width: playerWidth, height: playerHeight, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
          >
            <WebView
              source={{ uri: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` }}
              style={{ position: 'absolute', width: playerWidth, height: playerHeight }}
              scrollEnabled={false}
              pointerEvents="none"
            />
            <View style={{ width: 56, height: 40, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18 }}>▶</Text>
            </View>
          </Pressable>
        )
      ) : (
        <View style={{
          height: 100, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          borderWidth: 1, borderColor: colors.borderColor,
        }}>
          <Text style={{ fontSize: 24 }}>🎬</Text>
          <Text style={{ fontSize: 12, color: colors.mutedColor, marginTop: 4 }} numberOfLines={1}>
            {block.url || 'No URL'}
          </Text>
        </View>
      )}
      {block.caption ? (
        <Text style={{ fontSize: 12, color: colors.mutedColor, textAlign: 'center', marginTop: 4 }}>
          {block.caption}
        </Text>
      ) : null}
    </View>
  );
};

export default PreviewVideo;
