import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import type { VideoCarouselBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props {
  block: VideoCarouselBlock;
  isDark?: boolean;
  colors: PreviewColors;
}

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
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
  return url.startsWith('/uploads/') ? `${SERVER_ORIGIN}${url}` : url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Single hosted video player — isolated so state resets on URL change
// ─────────────────────────────────────────────────────────────────────────────
const HostedPlayer: React.FC<{ uri: string; width: number; height: number }> = ({ uri, width, height }) => {
  const videoRef = useRef<Video>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const reload = async () => {
      if (!videoRef.current) return;
      try {
        await videoRef.current.unloadAsync();
        await videoRef.current.loadAsync({ uri }, {}, false);
      } catch (e) {
        if (__DEV__) console.warn('HostedPlayer reload error:', e);
        setReady(true);
      }
    };
    reload();
  }, [uri]);

  return (
    <View style={{ width, height, backgroundColor: '#000' }}>
      {!ready && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center', zIndex: 1, backgroundColor: '#000',
        }}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 6 }}>Loading…</Text>
        </View>
      )}
      <Video
        ref={videoRef}
        source={{ uri }}
        style={{ width, height }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        onReadyForDisplay={() => setReady(true)}
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// YouTube slide
// ─────────────────────────────────────────────────────────────────────────────
const YouTubeSlide: React.FC<{ youtubeId: string; width: number; height: number }> = ({ youtubeId, width, height }) => {
  const [playing, setPlaying] = useState(false);

  return playing ? (
    <View style={{ width, height, backgroundColor: '#000' }}>
      <WebView
        source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}body{background:#000;width:100vw;height:100vh}iframe{width:100%;height:100%;border:none}</style></head><body><iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen></iframe></body></html>` }}
        style={{ width, height }}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        originWhitelist={['*']}
      />
    </View>
  ) : (
    <Pressable
      onPress={() => setPlaying(true)}
      style={{ width, height, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
    >
      <WebView
        source={{ uri: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` }}
        style={{ position: 'absolute', width, height }}
        scrollEnabled={false}
        pointerEvents="none"
      />
      <View style={{ width: 70, height: 40, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
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
};

// ─────────────────────────────────────────────────────────────────────────────
// PreviewVideoCarousel
// ─────────────────────────────────────────────────────────────────────────────
const PreviewVideoCarousel: React.FC<Props> = ({ block, isDark = false, colors }) => {
  const [idx, setIdx] = useState(0);
  const { width }     = useWindowDimensions();

  const playerWidth  = width - 35;
  const playerHeight = Math.round(playerWidth * 9 / 16);
  const videos       = block.videos ?? [];
  const total        = videos.length;

  if (total === 0) return null;

  const current    = videos[idx];
  const youtubeId  = current.url ? getYouTubeId(current.url) : null;
  const hosted     = current.url ? isHostedVideo(current.url) : false;

  const goTo = (next: number) => setIdx(next);

  const renderSlide = () => {
    if (!current.url) {
      return (
        <View style={{
          width: playerWidth, height: playerHeight,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        }}>
          <Text style={{ fontSize: 28 }}>🎬</Text>
          <Text style={{ fontSize: 12, color: colors.mutedColor, marginTop: 4 }}>No video</Text>
        </View>
      );
    }
    if (youtubeId) {
      return <YouTubeSlide key={`yt-${idx}-${youtubeId}`} youtubeId={youtubeId} width={playerWidth} height={playerHeight} />;
    }
    if (hosted) {
      return <HostedPlayer key={`hp-${idx}-${current.url}`} uri={resolveUrl(current.url)} width={playerWidth} height={playerHeight} />;
    }
    return (
      <View style={{
        width: playerWidth, height: playerHeight,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: isDark ? '#1e293b' : '#fef2f2',
      }}>
        <Text style={{ fontSize: 12, color: '#ef4444' }}>⚠️ Unsupported URL</Text>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Player with nav arrows */}
      <View style={{ width: playerWidth, height: playerHeight, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }}>
        {renderSlide()}

        {/* Prev / Next overlays */}
        {total > 1 && (
          <>
            <Pressable
              onPress={() => idx > 0 && goTo(idx - 1)}
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 44,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {idx > 0 && (
                <View style={{
                  backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20,
                  width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 18, lineHeight: 22 }}>‹</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => idx < total - 1 && goTo(idx + 1)}
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 44,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {idx < total - 1 && (
                <View style={{
                  backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20,
                  width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 18, lineHeight: 22 }}>›</Text>
                </View>
              )}
            </Pressable>
          </>
        )}

        {/* Counter badge */}
        {total > 1 && (
          <View style={{
            position: 'absolute', bottom: 8, right: 8,
            backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
              {idx + 1} / {total}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      {current.title ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textColor, marginTop: 6, textAlign: 'center' }}>
          {current.title}
        </Text>
      ) : null}

      {/* Dot indicators */}
      {total > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {videos.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)}>
              <View style={{
                width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
                backgroundColor: i === idx ? '#ef4444' : (isDark ? '#334155' : '#cbd5e1'),
              }} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default PreviewVideoCarousel;
