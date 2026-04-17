import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Image,
  ActivityIndicator, Alert, ScrollView, useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { tokenManager } from '../../../../../services/api/tokenManager';
import type { ImageCarouselBlock, ImageItem } from '../../types/types';
import { newId } from '../../utils/idUtils';

interface Props {
  block: ImageCarouselBlock;
  isDark: boolean;
  onChange: (patch: Partial<ImageCarouselBlock>) => void;
}

const BASE_URL    = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
const ACCENT      = '#ec4899';

function resolveUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${SERVER_ORIGIN}${url}` : url;
}

async function uploadImage(uri: string, mimeType: string, filename: string): Promise<string> {
  const token      = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();
  const formData   = new FormData();
  formData.append('file', { uri, type: mimeType, name: filename } as any);

  const res = await fetch(`${BASE_URL}/uploads/image`, {
    method: 'POST',
    headers: {
      ...(token      ? { Authorization: `Bearer ${token}` }      : {}),
      ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug }           : {}),
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Upload failed: ${res.status}`);
  }
  return (await res.json()).url as string;
}

async function deleteImage(url: string): Promise<void> {
  if (!url?.startsWith('/uploads/')) return;
  const token      = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();
  try {
    await fetch(`${BASE_URL}/uploads/media`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token      ? { Authorization: `Bearer ${token}` }      : {}),
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug }           : {}),
      },
      body: JSON.stringify({ url }),
    });
  } catch (e) {
    if (__DEV__) console.warn('⚠️ Could not delete image:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single image card inside the carousel editor
// ─────────────────────────────────────────────────────────────────────────────
interface CardProps {
  item: ImageItem;
  idx: number;
  total: number;
  isDark: boolean;
  onUpdate: (patch: Partial<ImageItem>) => void;
  onRemove: () => void;
}

const ImageCard: React.FC<CardProps> = ({ item, idx, total, isDark, onUpdate, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const { width } = useWindowDimensions();
  const cardWidth = width - 80; // matches preview width

  const bg     = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const muted  = isDark ? '#64748b' : '#94a3b8';
  const text   = isDark ? '#e2e8f0' : '#1e293b';

  const handleUpload = async (uri: string, mimeType: string, filename: string) => {
    setUploading(true);
    setImgError(false);
    try {
      if (item.url?.startsWith('/uploads/')) await deleteImage(item.url);
      const hostedPath = await uploadImage(uri, mimeType, filename);
      onUpdate({ url: hostedPath });
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const pickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Allow media library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      await handleUpload(a.uri, a.mimeType ?? 'image/jpeg', a.uri.split('/').pop() ?? 'image.jpg');
    }
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      await handleUpload(a.uri, a.mimeType ?? 'image/jpeg', `photo_${Date.now()}.jpg`);
    }
  };

  const clearImage = () => {
    if (item.url?.startsWith('/uploads/')) deleteImage(item.url);
    onUpdate({ url: '' });
    setImgError(false);
  };

  return (
    <View style={{
      borderRadius: 12, overflow: 'hidden',
      borderWidth: 1.5, borderColor: isDark ? '#334155' : '#fbcfe8',
      backgroundColor: isDark ? '#1e293b' : '#fff',
      marginBottom: 10,
    }}>
      {/* Card header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: isDark ? '#0f172a' : '#fdf2f8',
      }}>
        <View style={{
          width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
          backgroundColor: ACCENT,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{idx + 1}</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: muted }}>
          {item.caption || `Image ${idx + 1}`}
        </Text>
        <Pressable onPress={onRemove} hitSlop={6}>
          <Text style={{ fontSize: 13, color: '#ef4444' }}>✕</Text>
        </Pressable>
      </View>

      <View style={{ padding: 10, gap: 8 }}>
        {/* Image preview */}
        {item.url ? (
          <View style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
            {imgError ? (
              <View style={{
                height: 120, alignItems: 'center', justifyContent: 'center', gap: 4,
                backgroundColor: isDark ? '#1e293b' : '#fef2f2',
              }}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
                <Text style={{ fontSize: 11, color: '#ef4444' }}>Could not load image</Text>
              </View>
            ) : (
              <Image
                source={{ uri: resolveUrl(item.url) }}
                style={{ width: '100%', height: 140, resizeMode: 'cover' }}
                onError={() => setImgError(true)}
              />
            )}
            {/* Clear button overlay */}
            <Pressable
              onPress={clearImage}
              style={{
                position: 'absolute', top: 6, right: 6,
                backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12,
                width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>✕</Text>
            </Pressable>
          </View>
        ) : uploading ? (
          <View style={{
            height: 100, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: isDark ? '#2d1a2e' : '#fdf4ff',
            borderWidth: 1.5, borderColor: ACCENT,
          }}>
            <ActivityIndicator color={ACCENT} />
            <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600' }}>Uploading…</Text>
          </View>
        ) : (
          /* Pick buttons */
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={pickGallery}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 5, paddingVertical: 10, borderRadius: 8,
                backgroundColor: pressed ? '#db2777' : ACCENT,
              })}
            >
              <Text style={{ fontSize: 16 }}>🖼️</Text>
              <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={pickCamera}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 5, paddingVertical: 10, borderRadius: 8,
                borderWidth: 1.5, borderColor: ACCENT,
                backgroundColor: pressed ? (isDark ? '#2d1a2e' : '#fdf4ff') : 'transparent',
              })}
            >
              <Text style={{ fontSize: 16 }}>📸</Text>
              <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600' }}>Camera</Text>
            </Pressable>
          </View>
        )}

        {/* Replace button when image exists and not uploading */}
        {item.url && !uploading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={pickGallery}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 5, paddingVertical: 7, borderRadius: 8,
                backgroundColor: pressed ? '#db2777' : ACCENT,
              })}
            >
              <Text style={{ fontSize: 14 }}>🖼️</Text>
              <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>Replace</Text>
            </Pressable>
            <Pressable
              onPress={pickCamera}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 5, paddingVertical: 7, borderRadius: 8,
                borderWidth: 1.5, borderColor: ACCENT,
                backgroundColor: pressed ? (isDark ? '#2d1a2e' : '#fdf4ff') : 'transparent',
              })}
            >
              <Text style={{ fontSize: 14 }}>📸</Text>
              <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600' }}>Camera</Text>
            </Pressable>
          </View>
        )}

        {/* Caption input */}
        <TextInput
          value={item.caption}
          onChangeText={(caption) => onUpdate({ caption })}
          placeholder="Caption (optional)…"
          placeholderTextColor={muted}
          style={{
            fontSize: 12, color: text, paddingVertical: 7, paddingHorizontal: 10,
            backgroundColor: bg, borderRadius: 8, borderWidth: 1, borderColor: border,
            fontStyle: 'italic',
          }}
        />
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ImageCarouselEditor
// ─────────────────────────────────────────────────────────────────────────────
const ImageCarouselEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const images = block.images ?? [];

  const updateImage = (idx: number, patch: Partial<ImageItem>) =>
    onChange({ images: images.map((img, i) => (i === idx ? { ...img, ...patch } : img)) });

  const addImage = () =>
    onChange({ images: [...images, { id: newId(), caption: '', url: '' }] });

  const removeImage = (idx: number) => {
    const img = images[idx];
    if (img?.url?.startsWith('/uploads/')) deleteImage(img.url);
    onChange({ images: images.filter((_, i) => i !== idx) });
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          backgroundColor: ACCENT + '18',
        }}>
          <Text style={{ fontSize: 20 }}>🖼️</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
            Image Carousel
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8' }}>
            {block.images?.length ?? 0} image{(block.images?.length ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Empty state */}
      {images.length === 0 && (
        <View style={{
          height: 80, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#1e293b' : '#fdf2f8',
          borderWidth: 2, borderColor: isDark ? '#334155' : '#fbcfe8', borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#f9a8d4' }}>
            No images yet — tap "Add Image" below
          </Text>
        </View>
      )}

      {/* Image cards */}
      {images.map((img, idx) => (
        <ImageCard
          key={img.id}
          item={img}
          idx={idx}
          total={images.length}
          isDark={isDark}
          onUpdate={(patch) => updateImage(idx, patch)}
          onRemove={() => removeImage(idx)}
        />
      ))}

      {/* Add button */}
      <Pressable
        onPress={addImage}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          paddingVertical: 10, borderRadius: 10,
          backgroundColor: pressed ? ACCENT + '22' : ACCENT + '12',
          borderWidth: 1.5, borderColor: ACCENT + '44',
        })}
      >
        <Text style={{ fontSize: 16 }}>🖼️</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>Add Image</Text>
      </Pressable>
    </View>
  );
};

export default ImageCarouselEditor;
