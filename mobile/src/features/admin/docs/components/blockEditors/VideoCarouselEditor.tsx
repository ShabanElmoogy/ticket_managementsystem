import React, { useState, useRef } from 'react';
import Toast from 'react-native-toast-message';
import {
  View, Text, TextInput, Pressable,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { tokenManager } from '@/src/services/api/tokenManager';
import type { VideoCarouselBlock, VideoItem } from '../../types/types';
import { newId } from '../../utils/idUtils';

interface Props {
  block: VideoCarouselBlock;
  isDark: boolean;
  onChange: (patch: Partial<VideoCarouselBlock>) => void;
}

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
const ACCENT        = '#ef4444';

type Tab = 'link' | 'upload';

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

async function uploadVideo(uri: string, mimeType: string, filename: string): Promise<string> {
  const token      = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();
  const formData   = new FormData();
  formData.append('file', { uri, type: mimeType, name: filename } as any);

  const res = await fetch(`${BASE_URL}/uploads/media`, {
    method: 'POST',
    headers: {
      ...(token      ? { Authorization: `Bearer ${token}` }  : {}),
      ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug }       : {}),
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Upload failed: ${res.status}`);
  }
  return (await res.json()).url as string;
}

async function deleteVideo(url: string): Promise<void> {
  if (!url?.startsWith('/uploads/')) return;
  const token      = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();
  try {
    await fetch(`${BASE_URL}/uploads/media`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token      ? { Authorization: `Bearer ${token}` }  : {}),
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug }       : {}),
      },
      body: JSON.stringify({ url }),
    });
  } catch (e) {
    if (__DEV__) console.warn('⚠️ Could not delete video:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single video card
// ─────────────────────────────────────────────────────────────────────────────
interface CardProps {
  item: VideoItem;
  idx: number;
  isDark: boolean;
  onUpdate: (patch: Partial<VideoItem>) => void;
  onRemove: () => void;
}

const VideoCard: React.FC<CardProps> = ({ item, idx, isDark, onUpdate, onRemove }) => {
  const [tab, setTab]           = useState<Tab>(item.url ? (getYouTubeId(item.url) ? 'link' : 'upload') : 'upload');
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const { width } = useWindowDimensions();

  const playerWidth  = width - 96;
  const playerHeight = Math.round(playerWidth * 9 / 16);

  const bg     = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const muted  = isDark ? '#64748b' : '#94a3b8';
  const text   = isDark ? '#e2e8f0' : '#1e293b';
  const tabBg  = isDark ? '#0f172a' : '#f1f5f9';

  const youtubeId   = item.url ? getYouTubeId(item.url) : null;
  const hostedVideo = item.url ? isHostedVideo(item.url) : false;

  const handleUpload = async (uri: string, mimeType: string, filename: string) => {
    setUploading(true);
    try {
      if (item.url?.startsWith('/uploads/')) await deleteVideo(item.url);
      const hostedPath = await uploadVideo(uri, mimeType, filename);
      onUpdate({ url: hostedPath });
      setPlaying(false);
      setEmbedError(false);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: err?.message ?? 'Could not upload video.', visibilityTime: 3500, position: 'top' });
    } finally {
      setUploading(false);
    }
  };

  const pickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Toast.show({ type: 'info', text1: 'Permission required', text2: 'Allow media library access.', visibilityTime: 3000, position: 'top' }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      await handleUpload(a.uri, a.mimeType ?? 'video/mp4', a.uri.split('/').pop() ?? 'video.mp4');
    }
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Toast.show({ type: 'info', text1: 'Permission required', text2: 'Allow camera access.', visibilityTime: 3000, position: 'top' }); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      videoMaxDuration: 300,
      quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      await handleUpload(a.uri, a.mimeType ?? 'video/mp4', `video_${Date.now()}.mp4`);
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      await handleUpload(a.uri, a.mimeType ?? 'video/mp4', a.name);
    }
  };

  const clearVideo = () => {
    if (item.url?.startsWith('/uploads/')) deleteVideo(item.url);
    onUpdate({ url: '' });
    setPlaying(false);
    setEmbedError(false);
  };

  return (
    <View style={{
      borderRadius: 12, overflow: 'hidden',
      borderWidth: 1.5, borderColor: isDark ? '#334155' : '#fecaca',
      backgroundColor: isDark ? '#1e293b' : '#fff',
      marginBottom: 10,
    }}>
      {/* Card header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: isDark ? '#0f172a' : '#fef2f2',
      }}>
        <View style={{
          width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
          backgroundColor: ACCENT,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{idx + 1}</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: muted }}>
          {item.title || `Video ${idx + 1}`}
        </Text>
        <Pressable onPress={onRemove} hitSlop={6}>
          <Text style={{ fontSize: 13, color: '#ef4444' }}>✕</Text>
        </Pressable>
      </View>

      <View style={{ padding: 10, gap: 8 }}>
        {/* Title input */}
        <TextInput
          value={item.title}
          onChangeText={(title) => onUpdate({ title })}
          placeholder="Video title…"
          placeholderTextColor={muted}
          style={{
            fontSize: 13, color: text, paddingVertical: 7, paddingHorizontal: 10,
            backgroundColor: bg, borderRadius: 8, borderWidth: 1, borderColor: border,
          }}
        />

        {/* Tab switcher */}
        <View style={{ flexDirection: 'row', backgroundColor: tabBg, borderRadius: 8, padding: 3 }}>
          {(['link', 'upload'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: 6, borderRadius: 6, alignItems: 'center',
                backgroundColor: tab === t ? ACCENT : 'transparent',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: tab === t ? '#fff' : muted }}>
                {t === 'link' ? '🔗 Link' : '📁 Upload'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Link tab */}
        {tab === 'link' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: bg, borderRadius: 8, borderWidth: 1, borderColor: border,
            paddingHorizontal: 10, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 14 }}>🔗</Text>
            <TextInput
              value={hostedVideo ? '' : (item.url ?? '')}
              onChangeText={(url) => { onUpdate({ url }); setPlaying(false); setEmbedError(false); }}
              onEndEditing={(e) => {
                if (e.nativeEvent.text && item.url?.startsWith('/uploads/')) deleteVideo(item.url);
              }}
              placeholder="Paste YouTube URL…"
              placeholderTextColor={muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ flex: 1, fontSize: 12, color: text, paddingVertical: 8 }}
            />
            {item.url ? (
              <Pressable onPress={clearVideo} hitSlop={6}>
                <Text style={{ fontSize: 13, color: '#ef4444' }}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Upload tab */}
        {tab === 'upload' && (
          <View style={{ gap: 6 }}>
            {uploading ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, paddingVertical: 14, borderRadius: 8,
                backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
                borderWidth: 1.5, borderColor: '#3b82f6',
              }}>
                <ActivityIndicator color="#3b82f6" />
                <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '600' }}>Uploading…</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable
                  onPress={pickGallery}
                  style={({ pressed }) => ({
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 4, paddingVertical: 9, borderRadius: 8,
                    backgroundColor: pressed ? '#2563eb' : '#3b82f6',
                  })}
                >
                  <Text style={{ fontSize: 15 }}>🎞️</Text>
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>Gallery</Text>
                </Pressable>
                <Pressable
                  onPress={pickCamera}
                  style={({ pressed }) => ({
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 4, paddingVertical: 9, borderRadius: 8,
                    borderWidth: 1.5, borderColor: '#3b82f6',
                    backgroundColor: pressed ? (isDark ? '#1e3a5f' : '#eff6ff') : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 15 }}>📹</Text>
                  <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '600' }}>Camera</Text>
                </Pressable>
                <Pressable
                  onPress={pickFile}
                  style={({ pressed }) => ({
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 4, paddingVertical: 9, borderRadius: 8,
                    borderWidth: 1.5, borderColor: border,
                    backgroundColor: pressed ? border : bg,
                  })}
                >
                  <Text style={{ fontSize: 15 }}>📂</Text>
                  <Text style={{ fontSize: 11, color: text, fontWeight: '600' }}>Files</Text>
                </Pressable>
              </View>
            )}

            {/* Hosted badge */}
            {item.url?.startsWith('/uploads/') && !uploading && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: isDark ? '#0f2d1a' : '#f0fdf4',
                borderRadius: 6, borderWidth: 1, borderColor: '#22c55e',
                paddingHorizontal: 8, paddingVertical: 6,
              }}>
                <Text style={{ fontSize: 14 }}>✅</Text>
                <Text style={{ flex: 1, fontSize: 11, color: '#22c55e', fontWeight: '600' }} numberOfLines={1}>
                  {item.url.split('/').pop()}
                </Text>
                <Pressable onPress={clearVideo} hitSlop={6}>
                  <Text style={{ fontSize: 12, color: '#ef4444' }}>✕</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Preview */}
        {item.url && !uploading && (
          youtubeId ? (
            playing ? (
              <View style={{ width: playerWidth, height: playerHeight, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
                <WebView
                  source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}body{background:#000;width:100vw;height:100vh}iframe{width:100%;height:100%;border:none}</style></head><body><iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen></iframe></body></html>` }}
                  style={{ width: playerWidth, height: playerHeight }}
                  allowsFullscreenVideo mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled originWhitelist={['*']}
                  onError={() => { setEmbedError(true); setPlaying(false); }}
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
                  scrollEnabled={false} pointerEvents="none"
                />
                <View style={{ width: 48, height: 34, borderRadius: 6, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 16 }}>▶</Text>
                </View>
              </Pressable>
            )
          ) : hostedVideo ? (
            <View style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
              <Video
                key={resolveUrl(item.url)}
                source={{ uri: resolveUrl(item.url) }}
                style={{ width: playerWidth, height: playerHeight }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                onError={(e) => { if (__DEV__) console.warn('VideoCard error:', e); }}
              />
            </View>
          ) : null
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VideoCarouselEditor
// ─────────────────────────────────────────────────────────────────────────────
const VideoCarouselEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const videos = block.videos ?? [];

  const updateVideo = (idx: number, patch: Partial<VideoItem>) =>
    onChange({ videos: videos.map((v, i) => (i === idx ? { ...v, ...patch } : v)) });

  const addVideo = () =>
    onChange({ videos: [...videos, { id: newId(), title: '', url: '' }] });

  const removeVideo = (idx: number) => {
    const v = videos[idx];
    if (v?.url?.startsWith('/uploads/')) deleteVideo(v.url);
    onChange({ videos: videos.filter((_, i) => i !== idx) });
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          backgroundColor: ACCENT + '18',
        }}>
          <Text style={{ fontSize: 20 }}>🎬</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
            Video Carousel
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8' }}>
            {block.videos?.length ?? 0} video{(block.videos?.length ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Empty state */}
      {videos.length === 0 && (
        <View style={{
          height: 80, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#1e293b' : '#fef2f2',
          borderWidth: 2, borderColor: isDark ? '#334155' : '#fecaca', borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#fca5a5' }}>
            No videos yet — tap "Add Video" below
          </Text>
        </View>
      )}

      {/* Video cards */}
      {videos.map((video, idx) => (
        <VideoCard
          key={video.id}
          item={video}
          idx={idx}
          isDark={isDark}
          onUpdate={(patch) => updateVideo(idx, patch)}
          onRemove={() => removeVideo(idx)}
        />
      ))}

      {/* Add button */}
      <Pressable
        onPress={addVideo}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          paddingVertical: 10, borderRadius: 10,
          backgroundColor: pressed ? ACCENT + '22' : ACCENT + '12',
          borderWidth: 1.5, borderColor: ACCENT + '44',
        })}
      >
        <Text style={{ fontSize: 16 }}>🎬</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>Add Video</Text>
      </Pressable>
    </View>
  );
};

export default VideoCarouselEditor;

