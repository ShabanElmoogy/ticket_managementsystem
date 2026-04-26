import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, Alert, useWindowDimensions, Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { tokenManager } from '@/src/services/api/tokenManager';
import type { ExcelBlock } from '../../types/types';
import ExcelViewer from '../shared/ExcelViewer';

interface Props {
  block: ExcelBlock;
  isDark: boolean;
  onChange: (patch: Partial<ExcelBlock>) => void;
}

type Tab = 'link' | 'upload';

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
const ACCENT        = '#16a34a';

function resolveUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${SERVER_ORIGIN}${url}` : url;
}

async function uploadExcelToServer(uri: string, filename: string, mimeType: string): Promise<{ url: string; name: string }> {
  const token      = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();
  const formData   = new FormData();
  formData.append('file', { uri, type: mimeType, name: filename } as any);

  const res = await fetch(`${BASE_URL}/uploads/excel`, {
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

  const data = await res.json();
  return { url: data.url as string, name: filename };
}

async function deleteFileFromServer(url: string): Promise<void> {
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
    if (__DEV__) console.warn('⚠️ Could not delete file:', e);
  }
}

const ExcelBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [tab, setTab]             = useState<Tab>(block.url?.startsWith('/uploads/') ? 'upload' : 'link');
  const [uploading, setUploading] = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { width, height }         = useWindowDimensions();

  const viewerWidth  = width - 80;
  const viewerHeight = 400;

  const bg     = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const text   = isDark ? '#e2e8f0' : '#1e293b';
  const muted  = isDark ? '#64748b' : '#94a3b8';
  const tabBg  = isDark ? '#0f172a' : '#f1f5f9';

  const isUploaded = !!block.url?.startsWith('/uploads/');

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        '*/*',
      ],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext   = asset.name.split('.').pop()?.toLowerCase() ?? '';
      if (!['xls', 'xlsx', 'csv'].includes(ext)) {
        Alert.alert('Invalid file', 'Please select an Excel (.xls, .xlsx) or CSV file.');
        return;
      }
      setUploading(true);
      try {
        if (block.url?.startsWith('/uploads/')) await deleteFileFromServer(block.url);
        const mimeType = asset.mimeType ?? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const { url, name } = await uploadExcelToServer(asset.uri, asset.name, mimeType);
        onChange({ url, name });
        setExpanded(false);
        if (__DEV__) console.log('✅ Excel uploaded:', url);
      } catch (err: any) {
        Alert.alert('Upload failed', err?.message ?? 'Could not upload file.');
        if (__DEV__) console.error('❌ Excel upload error:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleClear = () => {
    if (block.url?.startsWith('/uploads/')) deleteFileFromServer(block.url);
    onChange({ url: '', name: '' });
    setExpanded(false);
  };

  const fileExt = (block.name || block.url || '').split('.').pop()?.toUpperCase() ?? 'XLSX';
  const iconEmoji = fileExt === 'CSV' ? '📋' : '📊';

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
              backgroundColor: tab === t ? ACCENT : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t ? '#fff' : muted }}>
              {t === 'link' ? '🔗 Link' : '📊 Upload'}
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
            value={isUploaded ? '' : (block.url ?? '')}
            onChangeText={(url) => onChange({ url, name: url.split('/').pop() ?? '' })}
            onEndEditing={(e) => {
              if (e.nativeEvent.text && block.url?.startsWith('/uploads/')) {
                deleteFileFromServer(block.url);
              }
            }}
            placeholder="Paste Excel/CSV URL…"
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
              backgroundColor: isDark ? '#0f2d1a' : '#f0fdf4',
              borderWidth: 1.5, borderColor: ACCENT,
            }}>
              <ActivityIndicator color={ACCENT} />
              <Text style={{ fontSize: 13, color: ACCENT, fontWeight: '600' }}>Uploading file…</Text>
            </View>
          ) : (
            <Pressable
              onPress={handlePickFile}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, paddingVertical: 14, borderRadius: 10,
                backgroundColor: pressed ? '#15803d' : ACCENT,
              })}
            >
              <Text style={{ fontSize: 20 }}>📊</Text>
              <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>
                {isUploaded ? 'Replace file' : 'Choose Excel / CSV file'}
              </Text>
            </Pressable>
          )}

          {isUploaded && !uploading && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: isDark ? '#0f2d1a' : '#f0fdf4',
              borderRadius: 8, borderWidth: 1, borderColor: '#22c55e',
              paddingHorizontal: 10, paddingVertical: 8,
            }}>
              <Text style={{ fontSize: 16 }}>✅</Text>
              <Text style={{ flex: 1, fontSize: 12, color: '#22c55e', fontWeight: '600' }} numberOfLines={1}>
                {block.name || block.url?.split('/').pop()}
              </Text>
              <Pressable onPress={handleClear} hitSlop={6}>
                <Text style={{ fontSize: 14, color: '#ef4444' }}>✕</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* ── Preview card ── */}
      {block.url ? (
        <View>
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: pressed
                ? (isDark ? '#0f2d1a' : '#f0fdf4')
                : (isDark ? '#1e293b' : '#fff'),
              borderRadius: 12,
              borderBottomLeftRadius: expanded ? 0 : 12,
              borderBottomRightRadius: expanded ? 0 : 12,
              borderWidth: 1.5,
              borderColor: isDark ? '#166534' : '#bbf7d0',
              borderBottomColor: expanded ? 'transparent' : (isDark ? '#166534' : '#bbf7d0'),
              padding: 14,
            })}
          >
            <View style={{
              width: 44, height: 52, borderRadius: 6,
              backgroundColor: ACCENT + '18', borderWidth: 1.5, borderColor: ACCENT + '44',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 22 }}>{iconEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: text }} numberOfLines={2}>
                {block.name || block.url.split('/').pop() || 'Spreadsheet'}
              </Text>
              <Text style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                {expanded ? 'Tap to collapse' : 'Tap to preview'}
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: ACCENT }}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>

          {expanded && (
            <View style={{
              width: viewerWidth, height: viewerHeight,
              borderWidth: 1.5, borderTopWidth: 0,
              borderColor: isDark ? '#166534' : '#bbf7d0',
              borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
              overflow: 'hidden',
            }}>
              {/* Fullscreen button */}
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
                    backgroundColor: pressed ? ACCENT : ACCENT + '18',
                    borderWidth: 1, borderColor: ACCENT + '44',
                  })}
                >
                  <Text style={{ fontSize: 13 }}>⛶</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>Full screen</Text>
                </Pressable>
              </View>
              <ExcelViewer
                url={resolveUrl(block.url)}
                width={viewerWidth}
                height={viewerHeight - 38}
                isDark={isDark}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={{
          height: 100, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: isDark ? '#1e293b' : '#f0fdf4',
          borderWidth: 2, borderColor: isDark ? '#334155' : '#bbf7d0', borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 36 }}>📊</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>Add a spreadsheet</Text>
          <Text style={{ fontSize: 11, color: muted }}>
            {tab === 'link' ? 'Paste a URL above' : 'Choose an Excel or CSV file'}
          </Text>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#fff' }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: isDark ? '#1e293b' : '#fff',
            borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#e2e8f0',
          }}>
            <Text style={{ fontSize: 20 }}>{iconEmoji}</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: text }} numberOfLines={1}>
              {block.name || block.url?.split('/').pop() || 'Spreadsheet'}
            </Text>
            <Pressable
              onPress={() => setFullscreen(false)}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 36, height: 36, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: pressed ? (isDark ? '#334155' : '#f1f5f9') : 'transparent',
                borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
              })}
            >
              <Text style={{ fontSize: 16, color: muted }}>✕</Text>
            </Pressable>
          </View>
          <ExcelViewer
            url={resolveUrl(block.url)}
            width={width}
            height={height - 80}
            isDark={isDark}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default ExcelBlockEditor;
