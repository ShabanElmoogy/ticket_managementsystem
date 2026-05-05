import React, { useState } from 'react';
import {
  View, Text, Pressable, Linking, useWindowDimensions,
  Modal, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import type { ExcelBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';
import ExcelViewer from '../shared/ExcelViewer';

interface Props { block: ExcelBlock; colors: PreviewColors; }

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
const ACCENT        = '#16a34a';

function resolveUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${SERVER_ORIGIN}${url}` : url;
}

const PreviewExcel: React.FC<Props> = ({ block, colors }) => {
  const c      = useThemeColors();
  const isDark = useIsDark();
  const [expanded,   setExpanded]   = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { width, height }           = useWindowDimensions();

  if (!block.url) return null;

  const displayName  = block.name || block.url.split('/').pop() || 'Spreadsheet';
  const fullUrl      = resolveUrl(block.url);
  const viewerWidth  = width - 64;
  const viewerHeight = 400;
  const fileExt      = displayName.split('.').pop()?.toUpperCase() ?? 'XLSX';
  const iconEmoji    = fileExt === 'CSV' ? '📋' : '📊';

  const handleOpenExternal = () => Linking.openURL(fullUrl).catch(() => {});

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Header card */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 14,
          backgroundColor: pressed ? c.intent.successSurface : c.surface.card,
          borderRadius: 12,
          borderBottomLeftRadius: expanded ? 0 : 12,
          borderBottomRightRadius: expanded ? 0 : 12,
          borderWidth: 1.5,
          borderColor: c.intent.success + '66',
          borderBottomColor: expanded ? 'transparent' : c.intent.success + '66',
          padding: 14,
        })}
      >
        <View style={{
          width: 44, height: 52, borderRadius: 8,
          backgroundColor: ACCENT + '18', borderWidth: 1.5, borderColor: ACCENT + '44',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 24 }}>{iconEmoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textColor }} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={{ fontSize: 11, color: ACCENT, marginTop: 3, fontWeight: '600' }}>
            {fileExt} Spreadsheet
          </Text>
          <Text style={{ fontSize: 10, color: colors.mutedColor, marginTop: 2 }}>
            {expanded ? 'Tap to collapse' : 'Tap to view'}
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18, color: ACCENT }}>{expanded ? '▲' : '▼'}</Text>
          <Pressable onPress={handleOpenExternal} hitSlop={8}>
            <Text style={{ fontSize: 13, color: colors.mutedColor }}>↗</Text>
          </Pressable>
        </View>
      </Pressable>

      {/* Inline viewer */}
      {expanded && (
        <View style={{
          borderWidth: 1.5, borderTopWidth: 0,
          borderColor: c.intent.success + '66',
          borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
          overflow: 'hidden',
        }}>
          <View style={{
            flexDirection: 'row', justifyContent: 'flex-end',
            paddingHorizontal: 10, paddingVertical: 6,
            backgroundColor: c.surface.tertiary,
            borderBottomWidth: 1, borderBottomColor: c.border.primary,
          }}>
            <Pressable
              onPress={() => setFullscreen(true)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 7,
                backgroundColor: pressed ? ACCENT : ACCENT + '18',
                borderWidth: 1, borderColor: ACCENT + '44',
              })}
            >
              <Text style={{ fontSize: 13 }}>⛶</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>Full screen</Text>
            </Pressable>
          </View>
          <ExcelViewer
            url={fullUrl}
            width={viewerWidth}
            height={viewerHeight}
            onOpenExternal={handleOpenExternal}
          />
        </View>
      )}

      {/* Fullscreen modal */}
      <Modal
        visible={fullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullscreen(false)}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={{ flex: 1, backgroundColor: c.surface.secondary }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: c.surface.card,
            borderBottomWidth: 1, borderBottomColor: c.border.primary,
          }}>
            <Text style={{ fontSize: 20 }}>{iconEmoji}</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: c.text.primary }} numberOfLines={1}>
              {displayName}
            </Text>
            <Pressable
              onPress={() => setFullscreen(false)}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 36, height: 36, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: pressed ? c.surface.elevated : 'transparent',
                borderWidth: 1, borderColor: c.border.primary,
              })}
            >
              <Text style={{ fontSize: 16, color: c.text.muted }}>✕</Text>
            </Pressable>
          </View>
          <ExcelViewer
            url={fullUrl}
            width={width}
            height={height - 80}
            onOpenExternal={handleOpenExternal}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default PreviewExcel;
