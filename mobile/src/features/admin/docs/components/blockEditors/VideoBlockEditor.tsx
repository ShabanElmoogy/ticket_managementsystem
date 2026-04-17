import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, useWindowDimensions,
  Linking, Alert, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { tokenManager } from '../../../../../services/api/tokenManager';
import type { VideoBlock } from '../../types/types';

interface Props {
  block: VideoBlock;
  isDark: boolean;
  onChange: (patch: Partial<VideoBlock>) => void;
}

type Tab = 'link' | 'upload';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
// Strip trailing /api so we can build /uploads/<filename> absolute URLs
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/** Returns true for local file:// or content:// URIs (not yet uploaded) */
function isLocalUri(url: string): boolean {
  return url.startsWith('file://') || url.startsWith('content://');
}

/** Returns true for a hosted /uploads/... path or full https URL */
function isHostedVideo(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/uploads/')
  ) && !getYouTubeId(url);
}

/** Resolve a relative /uploads/... path to a full URL */
function resolveUrl(url: string): string {
  if (url.startsWith('/uploads/')) return `${SERVER_ORIGIN}${url}`;
  return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload helper — sends the file to POST /api/uploads/media
// ─────────────────────────────────────────────────────────────────────────────

async function uploadVideoToServer(
  uri: string,
  mimeType: string,
  filename: string,
): Promise<string> {
  const token = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();

  const formData = new FormData();
  // React Native FormData accepts { uri, type, name }
  formData.append('file', { uri, type: mimeType, name: filename } as any);

  const response = await fetch(`${BASE_URL}/uploads/media`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      // Do NOT set Content-Type — fetch sets it automatically with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.url as string; // e.g. "/uploads/1234-abc.mp4"
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete helper — removes an old hosted video from the server
// ─────────────────────────────────────────────────────────────────────────────

async function deleteVideoFromServer(url: string): Promise<void> {
  if (!url || !url.startsWith('/uploads/')) return; // only delete our own uploads
  const token = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();
  try {
    await fetch(`${BASE_URL}/uploads/media`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      },
      body: JSON.stringify({ url }),
    });
    if (__DEV__) console.log('🗑️ Old video deleted from server:', url);
  } catch (err) {
    // Non-fatal — log and continue
    if (__DEV__) console.warn('⚠️ Could not delete old video:', err);
  }
}

const VideoBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const { width } = useWindowDimensions();
  const [tab, setTab]           = useState<Tab>('link');
  const [playing, setPlaying]   = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const videoRef = useRef<Video>(null);

  const playerWidth  = width - 80;
  const playerHeight = Math.round(playerWidth * 9 / 16);
  const youtubeId    = block.url ? getYouTubeId(block.url) : null;
  const hostedVideo  = block.url ? isHostedVideo(block.url) : false;
  const localVideo   = block.url ? isLocalUri(block.url) : false;

  // Reload expo-av player when hosted URL changes
  useEffect(() => {
    if (!hostedVideo || !block.url) return;
    const reload = async () => {
      if (!videoRef.current) return;
      try {
        await videoRef.current.unloadAsync();
        await videoRef.current.loadAsync({ uri: resolveUrl(block.url!) }, {}, false);
      } catch (e) {
        if (__DEV__) console.warn('VideoBlockEditor reload error:', e);
      }
    };
    reload();
  }, [block.url]);

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg       = isDark ? '#1e293b' : '#f8fafc';
  const border   = isDark ? '#334155' : '#e2e8f0';
  const text     = isDark ? '#e2e8f0' : '#1e293b';
  const muted    = isDark ? '#64748b' : '#94a3b8';
  const tabBg    = isDark ? '#0f172a' : '#f1f5f9';
  const activeBg = '#3b82f6';

  // ── Upload flow ───────────────────────────────────────────────────────────

  const handleUpload = async (uri: string, mimeType: string, filename: string) => {
    const oldUrl = block.url ?? '';
    setUploading(true);
    try {
      // Delete old hosted video before uploading the new one
      if (oldUrl) await deleteVideoFromServer(oldUrl);

      const hostedPath = await uploadVideoToServer(uri, mimeType, filename);
      onChange({ url: hostedPath });
      setPlaying(false);
      setEmbedError(false);
      if (__DEV__) console.log('✅ Video uploaded:', hostedPath);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Could not upload video. Please try again.');
      if (__DEV__) console.error('❌ Video upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() ?? 'video.mp4';
      const mimeType = asset.mimeType ?? 'video/mp4';
      await handleUpload(asset.uri, mimeType, filename);
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await handleUpload(asset.uri, asset.mimeType ?? 'video/mp4', asset.name);
    }
  };

  const handleClear = () => {
    // Delete hosted video from server when user explicitly clears it
    if (block.url && isHostedVideo(block.url)) {
      deleteVideoFromServer(block.url);
    }
    onChange({ url: '' });
    setPlaying(false);
    setEmbedError(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ gap: 12 }}>

      {/* Tab switcher */}
      <View style={{ flexDirection: 'row', backgroundColor: tabBg, borderRadius: 10, padding: 3 }}>
        {(['link', 'upload'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center',
              backgroundColor: tab === t ? activeBg : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t ? '#fff' : muted }}>
              {t === 'link' ? '🔗 Link' : '📁 Upload'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Link tab ── */}
      {tab === 'link' && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: bg, borderRadius: 10, borderWidth: 1.5, borderColor: border,
          paddingHorizontal: 12, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: 16 }}>🔗</Text>
          <TextInput
            value={localVideo || hostedVideo ? '' : (block.url ?? '')}
            onChangeText={(url) => {
              onChange({ url });
              setPlaying(false);
              setEmbedError(false);
            }}
            onEndEditing={(e) => {
              // Delete old hosted video only after user finishes typing the new link
              const newUrl = e.nativeEvent.text;
              if (newUrl && block.url && isHostedVideo(block.url)) {
                deleteVideoFromServer(block.url);
              }
            }}
            placeholder="Paste YouTube URL…"
            placeholderTextColor={muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, fontSize: 13, color: text, paddingVertical: 10 }}
          />
          {block.url ? (
            <Pressable onPress={handleClear} hitSlop={6}>
              <Text style={{ fontSize: 14, color: '#ef4444' }}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* ── Upload tab ── */}
      {tab === 'upload' && (
        <View style={{ gap: 8 }}>
          {uploading ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 10, paddingVertical: 18, borderRadius: 10,
              backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
              borderWidth: 1.5, borderColor: '#3b82f6',
            }}>
              <ActivityIndicator color="#3b82f6" />
              <Text style={{ fontSize: 13, color: '#3b82f6', fontWeight: '600' }}>
                Uploading video…
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Gallery */}
              <Pressable
                onPress={handlePickFromGallery}
                style={({ pressed }) => ({
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, paddingVertical: 12, borderRadius: 10,
                  backgroundColor: pressed ? '#2563eb' : '#3b82f6',
                })}
              >
                <Text style={{ fontSize: 18 }}>🎞️</Text>
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '600' }}>Gallery</Text>
              </Pressable>

              {/* Files */}
              <Pressable
                onPress={handlePickDocument}
                style={({ pressed }) => ({
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, paddingVertical: 12, borderRadius: 10,
                  borderWidth: 1.5, borderColor: border,
                  backgroundColor: pressed ? border : bg,
                })}
              >
                <Text style={{ fontSize: 18 }}>📂</Text>
                <Text style={{ fontSize: 13, color: text, fontWeight: '600' }}>Files</Text>
              </Pressable>
            </View>
          )}

          {/* Hosted video filename badge */}
          {block.url && hostedVideo && !uploading && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: isDark ? '#0f2d1a' : '#f0fdf4',
              borderRadius: 8, borderWidth: 1, borderColor: '#22c55e',
              paddingHorizontal: 10, paddingVertical: 8,
            }}>
              <Text style={{ fontSize: 16 }}>✅</Text>
              <Text style={{ flex: 1, fontSize: 12, color: '#22c55e', fontWeight: '600' }} numberOfLines={1}>
                {block.url.split('/').pop()}
              </Text>
              <Pressable onPress={handleClear} hitSlop={6}>
                <Text style={{ fontSize: 14, color: '#ef4444' }}>✕</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* ── Preview ── */}
      {block.url && !uploading ? (
        youtubeId ? (
          // YouTube
          embedError ? (
            <View style={{
              width: playerWidth, height: 100, borderRadius: 12,
              backgroundColor: isDark ? '#1e293b' : '#fef2f2',
              borderWidth: 1.5, borderColor: isDark ? '#7f1d1d' : '#fecaca',
              alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>🚫 Embedding disabled</Text>
              <Pressable
                onPress={() => Linking.openURL(block.url!)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#ef4444',
                }}
              >
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>▶️ Watch on YouTube</Text>
              </Pressable>
            </View>
          ) : playing ? (
            <View style={{ width: playerWidth, height: playerHeight, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
              <WebView
                source={{
                  html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}body{background:#000;width:100vw;height:100vh}iframe{width:100%;height:100%;border:none}</style></head><body><iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen></iframe></body></html>`,
                }}
                style={{ width: playerWidth, height: playerHeight }}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                originWhitelist={['*']}
                onError={() => { setEmbedError(true); setPlaying(false); }}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setPlaying(true)}
              style={{
                width: playerWidth, height: playerHeight, borderRadius: 12,
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
          )
        ) : hostedVideo ? (
          // Hosted video — play with expo-av using the full URL
          <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
            <Video
              ref={videoRef}
              source={{ uri: resolveUrl(block.url) }}
              style={{ width: playerWidth, height: playerHeight }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              onError={(err) => {
                if (__DEV__) console.warn('Video playback error:', err);
              }}
            />
          </View>
        ) : localVideo ? (
          // Fallback: local URI (shouldn't normally reach here after upload)
          <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
            <Video
              ref={videoRef}
              source={{ uri: block.url }}
              style={{ width: playerWidth, height: playerHeight }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
            />
          </View>
        ) : (
          // Non-YouTube, non-hosted URL
          <View style={{
            height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDark ? '#1e293b' : '#fef2f2',
            borderWidth: 1.5, borderColor: isDark ? '#334155' : '#fecaca',
          }}>
            <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>
              ⚠️ Only YouTube URLs are supported for links
            </Text>
          </View>
        )
      ) : !uploading ? (
        // Empty state
        <View style={{
          height: 100, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6,
          backgroundColor: bg, borderWidth: 2, borderColor: border, borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 28 }}>▶️</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: muted }}>
            {tab === 'link' ? 'Paste a YouTube URL above' : 'Pick a video to upload'}
          </Text>
        </View>
      ) : null}

      {/* Caption */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: border, paddingTop: 8 }}>
        <Text style={{ fontSize: 13, color: muted }}>✏️</Text>
        <TextInput
          value={block.caption ?? ''}
          onChangeText={(caption) => onChange({ caption })}
          placeholder="Add a caption…"
          placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
          style={{ flex: 1, fontSize: 13, color: muted, fontStyle: 'italic' }}
        />
      </View>
    </View>
  );
};

export default VideoBlockEditor;
