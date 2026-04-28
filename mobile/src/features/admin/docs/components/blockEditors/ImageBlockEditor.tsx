import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import {
  View, Text, TextInput, Image, Pressable, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { tokenManager } from '@/src/services/api/tokenManager';
import type { ImageBlock } from '../../types/types';

interface Props {
  block: ImageBlock;
  isDark: boolean;
  onChange: (patch: Partial<ImageBlock>) => void;
}

type Tab = 'link' | 'upload';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

function isHostedImage(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('http://') || url.startsWith('https://');
}

function resolveUrl(url: string): string {
  if (url.startsWith('/uploads/')) return `${SERVER_ORIGIN}${url}`;
  return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload helpers
// ─────────────────────────────────────────────────────────────────────────────

async function uploadImageToServer(uri: string, mimeType: string, filename: string): Promise<string> {
  const token = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();

  const formData = new FormData();
  formData.append('file', { uri, type: mimeType, name: filename } as any);

  if (__DEV__) console.log(`📤 Uploading image to: ${BASE_URL}/uploads/image`);

  const response = await fetch(`${BASE_URL}/uploads/image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.url as string; // "/uploads/1234-abc.jpg"
}

async function deleteImageFromServer(url: string): Promise<void> {
  if (!url || !url.startsWith('/uploads/')) return;
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
    if (__DEV__) console.log('🗑️ Old image deleted:', url);
  } catch (err) {
    if (__DEV__) console.warn('⚠️ Could not delete old image:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ImageBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [tab, setTab]           = useState<Tab>('link');
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading]   = useState(false);

  const bg      = isDark ? '#1e293b' : '#f8fafc';
  const border  = isDark ? '#334155' : '#e2e8f0';
  const text    = isDark ? '#e2e8f0' : '#1e293b';
  const muted   = isDark ? '#64748b' : '#94a3b8';
  const tabBg   = isDark ? '#0f172a' : '#f1f5f9';
  const activeBg = '#ec4899';

  const hostedImage = block.url ? isHostedImage(block.url) : false;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUpload = async (uri: string, mimeType: string, filename: string) => {
    const oldUrl = block.url ?? '';
    setUploading(true);
    setLoadError(false);
    try {
      if (oldUrl.startsWith('/uploads/')) await deleteImageFromServer(oldUrl);
      const hostedPath = await uploadImageToServer(uri, mimeType, filename);
      onChange({ url: hostedPath });
      if (__DEV__) console.log('✅ Image uploaded:', hostedPath);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: err?.message ?? 'Could not upload image.', visibilityTime: 3500, position: 'top' });
      if (__DEV__) console.error('❌ Image upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'info', text1: 'Permission required', text2: 'Please allow access to your media library.', visibilityTime: 3000, position: 'top' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() ?? 'image.jpg';
      const mimeType = asset.mimeType ?? 'image/jpeg';
      await handleUpload(asset.uri, mimeType, filename);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'info', text1: 'Permission required', text2: 'Please allow access to your camera.', visibilityTime: 3000, position: 'top' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = `photo_${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      await handleUpload(asset.uri, mimeType, filename);
    }
  };

  const handleClear = () => {
    if (block.url?.startsWith('/uploads/')) deleteImageFromServer(block.url);
    onChange({ url: '' });
    setLoadError(false);
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
              {t === 'link' ? '🔗 Link' : '📷 Upload'}
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
            value={hostedImage && block.url?.startsWith('/uploads/') ? '' : (block.url ?? '')}
            onChangeText={(url) => { onChange({ url }); setLoadError(false); }}
            onEndEditing={(e) => {
              const newUrl = e.nativeEvent.text;
              if (newUrl && block.url?.startsWith('/uploads/')) {
                deleteImageFromServer(block.url);
              }
            }}
            placeholder="Paste image URL…"
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
              backgroundColor: isDark ? '#2d1a2e' : '#fdf4ff',
              borderWidth: 1.5, borderColor: '#ec4899',
            }}>
              <ActivityIndicator color="#ec4899" />
              <Text style={{ fontSize: 13, color: '#ec4899', fontWeight: '600' }}>
                Uploading image…
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Gallery */}
              <Pressable
                onPress={handlePickFromGallery}
                style={({ pressed }) => ({
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, paddingVertical: 13, borderRadius: 10,
                  backgroundColor: pressed ? '#db2777' : '#ec4899',
                })}
              >
                <Text style={{ fontSize: 18 }}>🖼️</Text>
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '600' }}>
                  {block.url?.startsWith('/uploads/') ? 'Replace' : 'Gallery'}
                </Text>
              </Pressable>

              {/* Camera */}
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => ({
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, paddingVertical: 13, borderRadius: 10,
                  borderWidth: 1.5, borderColor: '#ec4899',
                  backgroundColor: pressed ? (isDark ? '#2d1a2e' : '#fdf4ff') : 'transparent',
                })}
              >
                <Text style={{ fontSize: 18 }}>📸</Text>
                <Text style={{ fontSize: 13, color: '#ec4899', fontWeight: '600' }}>Camera</Text>
              </Pressable>
            </View>
          )}

          {/* Hosted image badge */}
          {block.url?.startsWith('/uploads/') && !uploading && (
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
        <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: border }}>
          {loading && (
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center', zIndex: 1,
              backgroundColor: bg,
            }}>
              <ActivityIndicator color="#ec4899" />
            </View>
          )}
          {loadError ? (
            <View style={{ height: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', gap: 6 }}>
              <Text style={{ fontSize: 28 }}>⚠️</Text>
              <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Could not load image</Text>
              <Text style={{ fontSize: 11, color: '#fca5a5' }}>Check the URL and try again</Text>
            </View>
          ) : (
            <Image
              source={{ uri: resolveUrl(block.url) }}
              style={{ width: '100%', height: 200, resizeMode: 'cover' }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setLoadError(true); }}
            />
          )}
        </View>
      ) : !uploading ? (
        <View style={{
          height: 140, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: isDark ? '#1e293b' : '#fdf2f8',
          borderWidth: 2, borderColor: isDark ? '#334155' : '#fbcfe8', borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 36 }}>🖼️</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#ec4899' }}>Add an image</Text>
          <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#f9a8d4' }}>
            {tab === 'link' ? 'Paste a URL above' : 'Gallery or Camera'}
          </Text>
        </View>
      ) : null}

      {/* Caption */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderTopWidth: 1, borderTopColor: border, paddingTop: 8,
      }}>
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

export default ImageBlockEditor;


