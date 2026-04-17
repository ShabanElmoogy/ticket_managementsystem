import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import type { VideoBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: VideoBlock; isDark: boolean; colors: PreviewColors; }

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function isHostedVideo(url: string): boolean {
  return (
    url.startsWith('/uploads/') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) && !getYouTubeId(url);
}

function resolveUrl(url: string): string {
  if (url.startsWith('/uploads/')) return `${SERVER_ORIGIN}${url}`;
  return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hosted video player — isolated component so its own state never leaks
// ─────────────────────────────────────────────────────────────────────────────
interface HostedVideoProps {
  uri: string;
  width: number;
  height: number;
}

const HostedVideoPlayer: React.FC<HostedVideoProps> = ({ uri, width, height }) => {
  const [ready, setReady] = useState(false);

  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'mp4';

  return (
    <View style={{ width, height, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
      {!ready && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#000', zIndex: 1,
        }}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>Loading video…</Text>
        </View>
      )}
      {/* key forces full remount when URI changes — avoids loadAsync extractor errors */}
      <Video
        key={uri}
        source={{ uri, overrideFileExtensionAndroid: ext }}
        style={{ width, height }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        onReadyForDisplay={() => setReady(true)}
        onLoad={() => setReady(true)}
        onError={(err) => {
          if (__DEV__) console.warn('HostedVideoPlayer error:', uri, err);
          setReady(true);
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PreviewVideo
// ─────────────────────────────────────────────────────────────────────────────
const PreviewVideo: React.FC<Props> = ({ block, isDark, colors }) => {
  const [playing, setPlaying] = useState(false);
  const { width } = useWindowDimensions();

  const playerWidth  = width - 35;
  const playerHeight = Math.round(playerWidth * 9 / 16);
  const youtubeId    = block.url ? getYouTubeId(block.url) : null;
  const hostedVideo  = block.url ? isHostedVideo(block.url) : false;

  // Reset YouTube play state when URL changes
  useEffect(() => {
    setPlaying(false);
  }, [block.url]);

  const renderPlayer = () => {
    if (!block.url) {
      return (
        <View style={{
          height: 100, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          borderWidth: 1, borderColor: colors.borderColor,
        }}>
          <Text style={{ fontSize: 24 }}>🎬</Text>
          <Text style={{ fontSize: 12, color: colors.mutedColor, marginTop: 4 }}>No video</Text>
        </View>
      );
    }

    // ── YouTube ──────────────────────────────────────────────────────────────
    if (youtubeId) {
      if (playing) {
        return (
          <View style={{ width: playerWidth, height: playerHeight, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
            <WebView
              source={{
                html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}body{background:#000;width:100vw;height:100vh}iframe{width:100%;height:100%;border:none}</style></head><body><iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen></iframe></body></html>`,
              }}
              style={{ width: playerWidth, height: playerHeight }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              originWhitelist={['*']}
            />
          </View>
        );
      }
      return (
        <Pressable
          onPress={() => setPlaying(true)}
          style={{
            width: playerWidth, height: playerHeight, borderRadius: 8,
            overflow: 'hidden', backgroundColor: '#000',
            alignItems: 'center', justifyContent: 'center',
          }}
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
          <Text style={{
            position: 'absolute', bottom: 8, fontSize: 11, color: '#fff', fontWeight: '600',
            backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
          }}>
            Tap to play
          </Text>
        </Pressable>
      );
    }

    // ── Hosted video ─────────────────────────────────────────────────────────
    if (hostedVideo) {
      return (
        <HostedVideoPlayer
          uri={resolveUrl(block.url)}
          width={playerWidth}
          height={playerHeight}
        />
      );
    }

    // ── Unknown URL ───────────────────────────────────────────────────────────
    return (
      <View style={{
        height: 80, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isDark ? '#1e293b' : '#fef2f2',
        borderWidth: 1, borderColor: isDark ? '#334155' : '#fecaca',
      }}>
        <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>
          ⚠️ Unsupported video URL
        </Text>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: 12 }}>
      {renderPlayer()}
      {block.caption ? (
        <Text style={{ fontSize: 12, color: colors.mutedColor, textAlign: 'center', marginTop: 4 }}>
          {block.caption}
        </Text>
      ) : null}
    </View>
  );
};

export default PreviewVideo;
