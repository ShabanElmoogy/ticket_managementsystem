import React, { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import type { ImageBlock } from '../../types/types';
import { useThemeColors } from '@/src/constants/theme';
import { usePreviewColors } from './previewUtils';

interface Props { block: ImageBlock; }

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

function resolveUrl(url: string): string {
  if (url.startsWith('/uploads/')) {
    const resolved = `${SERVER_ORIGIN}${url}`;
    if (__DEV__) console.log('🖼️ PreviewImage resolveUrl:', url, '→', resolved);
    return resolved;
  }
  return url;
}

const PreviewImage: React.FC<Props> = ({ block }) => {
  const c = useThemeColors();
  const colors = usePreviewColors();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);
  const { width } = useWindowDimensions();
  const imageWidth = width - 35; // same as PreviewVideo playerWidth

  // Reset error/loading whenever the URL changes
  useEffect(() => {
    setError(false);
    setLoading(false);
  }, [block.url]);

  return (
    <View style={{ marginBottom: 12 }}>
      {block.url ? (
        <View style={{ borderRadius: 8, overflow: 'hidden', width: imageWidth, minHeight: 200 }}>
          {loading && !error && (
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center', zIndex: 1,
              backgroundColor: c.surface.secondary,
              minHeight: 200,
            }}>
              <ActivityIndicator color="#ec4899" size="large" />
            </View>
          )}

          {error ? (
            <View style={{
              width: imageWidth, height: 200, borderRadius: 8,
              alignItems: 'center', justifyContent: 'center', gap: 6,
              backgroundColor: c.surface.secondary,
              borderWidth: 1, borderColor: c.border.primary,
            }}>
              <Text style={{ fontSize: 28 }}>⚠️</Text>
              <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Could not load image</Text>
              <Text style={{ fontSize: 11, color: c.text.muted }}>
                {resolveUrl(block.url)}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: resolveUrl(block.url) }}
              style={{ width: imageWidth, height: 200, resizeMode: 'cover' }}
              onLoadStart={() => { setLoading(true); setError(false); }}
              onLoadEnd={() => setLoading(false)}
              onError={(e) => {
                if (__DEV__) console.warn('🖼️ PreviewImage load error:', resolveUrl(block.url), e.nativeEvent);
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </View>
      ) : (
        <View style={{
          width: imageWidth, height: 100, borderRadius: 8,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: c.surface.tertiary,
          borderWidth: 1, borderColor: colors.borderColor,
        }}>
          <Text style={{ fontSize: 24 }}>🖼️</Text>
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

export default PreviewImage;
