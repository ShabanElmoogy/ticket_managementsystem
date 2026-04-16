import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useWindowDimensions, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import type { VideoBlock } from '../../types/types';

interface Props {
  block: VideoBlock;
  isDark: boolean;
  onChange: (patch: Partial<VideoBlock>) => void;
}

/** Extract YouTube video ID from any YouTube URL format */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const VideoBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const { width } = useWindowDimensions();
  const [showPlayer, setShowPlayer] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  const youtubeId = block.url ? getYouTubeId(block.url) : null;
  const isYouTube = !!youtubeId;
  // Aspect ratio 16:9, subtract card padding (14*2) and container padding (12*2)
  const playerWidth  = width - 80;
  const playerHeight = Math.round(playerWidth * 9 / 16);

  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1`
    : null;

  return (
    <View style={{ gap: 12 }}>
      {/* URL input */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderRadius: 10, borderWidth: 1.5,
        borderColor: isDark ? '#334155' : '#e2e8f0',
        paddingHorizontal: 12, paddingVertical: 2,
      }}>
        <Text style={{ fontSize: 16 }}>🔗</Text>
        <TextInput
          value={block.url}
          onChangeText={(url) => { onChange({ url }); setShowPlayer(false); setEmbedError(false); }}
          placeholder="Paste YouTube URL…"
          placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b', paddingVertical: 10 }}
        />
        {block.url ? (
          <Pressable onPress={() => { onChange({ url: '' }); setShowPlayer(false); setEmbedError(false); }} hitSlop={6}>
            <Text style={{ fontSize: 14, color: '#ef4444' }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Player / placeholder */}
      {isYouTube && embedUrl ? (
        showPlayer ? (
          // Inject YouTube iframe as HTML — bypasses embedding restrictions
          <View style={{
            width: playerWidth, height: playerHeight,
            borderRadius: 12, overflow: 'hidden',
            backgroundColor: '#000',
          }}>
            <WebView
              source={{
                html: `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#000; width:100vw; height:100vh; overflow:hidden; }
  iframe { width:100%; height:100%; border:none; display:block; }
</style>
</head>
<body>
<iframe
  src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
  allowfullscreen
></iframe>
</body>
</html>`,
              }}
              style={{ width: playerWidth, height: playerHeight }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              onError={() => { setEmbedError(true); setShowPlayer(false); }}
            />
          </View>
        ) : embedError ? (
          // Embedding disabled — offer to open in YouTube app
          <View style={{
            width: playerWidth, height: playerHeight,
            borderRadius: 12, overflow: 'hidden',
            backgroundColor: isDark ? '#1e293b' : '#fef2f2',
            borderWidth: 1.5, borderColor: isDark ? '#7f1d1d' : '#fecaca',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Text style={{ fontSize: 28 }}>🚫</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#fca5a5' : '#ef4444', textAlign: 'center' }}>
              Embedding disabled
            </Text>
            <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#fca5a5', textAlign: 'center', paddingHorizontal: 16 }}>
              The video owner has disabled embedding for this video.
            </Text>
            <Pressable
              onPress={() => Linking.openURL(block.url)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
                backgroundColor: pressed ? '#dc2626' : '#ef4444',
              })}
            >
              <Text style={{ fontSize: 14 }}>▶️</Text>
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>
                Watch on YouTube
              </Text>
            </Pressable>
          </View>
        ) : (
          // Thumbnail tap-to-play
          <Pressable
            onPress={() => setShowPlayer(true)}
            style={{
              width: playerWidth, height: playerHeight,
              borderRadius: 12, overflow: 'hidden',
              backgroundColor: '#000',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* YouTube thumbnail */}
            <WebView
              source={{ uri: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` }}
              style={{ position: 'absolute', width: playerWidth, height: playerHeight }}
              scrollEnabled={false}
              pointerEvents="none"
            />
            {/* Play button overlay */}
            <View style={{
              width: 64, height: 44, borderRadius: 10,
              backgroundColor: '#ef4444',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
            }}>
              <Text style={{ fontSize: 20, color: '#fff' }}>▶</Text>
            </View>
            <Text style={{
              position: 'absolute', bottom: 8,
              fontSize: 11, color: '#fff', fontWeight: '600',
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
            }}>
              Tap to play
            </Text>
          </Pressable>
        )
      ) : block.url ? (
        // Non-YouTube URL — show link
        <View style={{
          height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#1e293b' : '#fef2f2',
          borderWidth: 1.5, borderColor: isDark ? '#334155' : '#fecaca',
        }}>
          <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#ef4444', fontWeight: '600' }}>
            ⚠️ Only YouTube URLs are supported
          </Text>
        </View>
      ) : (
        // Empty state
        <View style={{
          height: 120, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6,
          backgroundColor: isDark ? '#1e293b' : '#fef2f2',
          borderWidth: 2, borderColor: isDark ? '#334155' : '#fecaca', borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 28 }}>▶️</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#475569' : '#fca5a5' }}>
            Add a YouTube video
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? '#334155' : '#fecaca' }}>
            Paste a URL above
          </Text>
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

export default VideoBlockEditor;
