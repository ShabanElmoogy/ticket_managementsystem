import React, { useState } from 'react';
import { View, Text, Image, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native';
import type { ImageCarouselBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props {
  block: ImageCarouselBlock;
  isDark: boolean;
  colors: PreviewColors;
}

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

function resolveUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${SERVER_ORIGIN}${url}` : url;
}

const PreviewImageCarousel: React.FC<Props> = ({ block, isDark, colors }) => {
  const [idx, setIdx]         = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);
  const { width }             = useWindowDimensions();

  const imageWidth  = width - 35;
  const imageHeight = Math.round(imageWidth * 9 / 16);
  const images      = block.images ?? [];
  const total       = images.length;

  if (total === 0) return null;

  const current = images[idx];

  const goTo = (next: number) => {
    setIdx(next);
    setLoading(false);
    setError(false);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Image */}
      <View style={{
        width: imageWidth, height: imageHeight,
        borderRadius: 10, overflow: 'hidden',
        backgroundColor: '#000',
      }}>
        {loading && !error && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center', zIndex: 1,
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
          }}>
            <ActivityIndicator color="#ec4899" size="large" />
          </View>
        )}
        {error ? (
          <View style={{
            flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
            backgroundColor: isDark ? '#1e293b' : '#fef2f2',
          }}>
            <Text style={{ fontSize: 24 }}>⚠️</Text>
            <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Could not load image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: resolveUrl(current.url) }}
            style={{ width: imageWidth, height: imageHeight, resizeMode: 'cover' }}
            onLoadStart={() => { setLoading(true); setError(false); }}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}

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

      {/* Caption */}
      {current.caption ? (
        <Text style={{ fontSize: 12, color: colors.mutedColor, textAlign: 'center', marginTop: 6 }}>
          {current.caption}
        </Text>
      ) : null}

      {/* Dot indicators */}
      {total > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {images.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)}>
              <View style={{
                width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
                backgroundColor: i === idx ? '#ec4899' : (isDark ? '#334155' : '#cbd5e1'),
              }} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default PreviewImageCarousel;
