import React, { useState } from 'react';
import { View, Text, Pressable, Linking, useWindowDimensions } from 'react-native';
import type { PdfBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';
import PdfViewer from '../shared/PdfViewer';
import PdfFullscreenModal from '../shared/PdfFullscreenModal';

interface Props { block: PdfBlock; isDark: boolean; colors: PreviewColors; }

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

function resolveUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${SERVER_ORIGIN}${url}` : url;
}

const PreviewPdf: React.FC<Props> = ({ block, isDark, colors }) => {
  const [expanded,   setExpanded]   = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { width } = useWindowDimensions();

  if (!block.url) return null;

  const displayName  = block.name || block.url.split('/').pop() || 'PDF Document';
  const fullUrl      = resolveUrl(block.url);
  const viewerWidth  = width - 64;
  const viewerHeight = Math.round(viewerWidth * 1.4);

  const handleOpenExternal = () => Linking.openURL(fullUrl).catch(() => {});

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Header card */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 14,
          backgroundColor: pressed
            ? (isDark ? '#2d1010' : '#fff5f5')
            : (isDark ? '#1e293b' : '#fff'),
          borderRadius: 12,
          borderBottomLeftRadius: expanded ? 0 : 12,
          borderBottomRightRadius: expanded ? 0 : 12,
          borderWidth: 1.5,
          borderColor: isDark ? '#7f1d1d' : '#fecaca',
          borderBottomColor: expanded ? 'transparent' : (isDark ? '#7f1d1d' : '#fecaca'),
          padding: 14,
        })}
      >
        <View style={{
          width: 44, height: 52, borderRadius: 8,
          backgroundColor: '#dc262618', borderWidth: 1.5, borderColor: '#dc262644',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 24 }}>📄</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textColor }} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={{ fontSize: 11, color: '#dc2626', marginTop: 3, fontWeight: '600' }}>PDF Document</Text>
          <Text style={{ fontSize: 10, color: colors.mutedColor, marginTop: 2 }}>
            {expanded ? 'Tap to collapse' : 'Tap to view'}
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18, color: '#dc2626' }}>{expanded ? '▲' : '▼'}</Text>
          <Pressable onPress={handleOpenExternal} hitSlop={8}>
            <Text style={{ fontSize: 13, color: colors.mutedColor }}>↗</Text>
          </Pressable>
        </View>
      </Pressable>

      {/* Inline PDF viewer */}
      {expanded && (
        <View style={{
          borderWidth: 1.5, borderTopWidth: 0,
          borderColor: isDark ? '#7f1d1d' : '#fecaca',
          borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
          overflow: 'hidden',
        }}>
          {/* Fullscreen button bar */}
          <View style={{
            flexDirection: 'row', justifyContent: 'flex-end',
            paddingHorizontal: 10, paddingVertical: 6,
            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
            borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#e2e8f0',
          }}>
            <Pressable
              onPress={() => setFullscreen(true)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 7,
                backgroundColor: pressed ? '#dc2626' : '#dc262618',
                borderWidth: 1, borderColor: '#dc262644',
              })}
            >
              <Text style={{ fontSize: 13 }}>⛶</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626' }}>Full screen</Text>
            </Pressable>
          </View>
          <PdfViewer
            url={fullUrl}
            width={viewerWidth}
            height={viewerHeight}
            isDark={isDark}
            onOpenExternal={handleOpenExternal}
          />
        </View>
      )}

      {/* Fullscreen modal */}
      <PdfFullscreenModal
        visible={fullscreen}
        url={fullUrl}
        name={displayName}
        isDark={isDark}
        onClose={() => setFullscreen(false)}
      />
    </View>
  );
};

export default PreviewPdf;
