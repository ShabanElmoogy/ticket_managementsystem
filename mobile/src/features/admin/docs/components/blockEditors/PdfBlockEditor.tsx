import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { tokenManager } from '@/src/services/api/tokenManager';
import type { PdfBlock } from '../../types/types';
import PdfViewer from '../shared/PdfViewer';
import PdfFullscreenModal from '../shared/PdfFullscreenModal';

interface Props {
  block: PdfBlock;
  isDark: boolean;
  onChange: (patch: Partial<PdfBlock>) => void;
}

type Tab = 'link' | 'upload';

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
const ACCENT        = '#dc2626';

function resolveUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${SERVER_ORIGIN}${url}` : url;
}

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

async function uploadPdfToServer(uri: string, filename: string): Promise<{ url: string; name: string }> {
  const token      = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();
  const formData   = new FormData();
  formData.append('file', { uri, type: 'application/pdf', name: filename } as any);

  const res = await fetch(`${BASE_URL}/uploads/pdf`, {
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

async function deletePdfFromServer(url: string): Promise<void> {
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
    if (__DEV__) console.log('🗑️ PDF deleted:', url);
  } catch (e) {
    if (__DEV__) console.warn('⚠️ Could not delete PDF:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const PdfBlockEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [tab, setTab]           = useState<Tab>(block.url?.startsWith('/uploads/') ? 'upload' : 'link');
  const [uploading, setUploading] = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { width }               = useWindowDimensions();

  const viewerWidth  = width - 80;
  const viewerHeight = Math.round(viewerWidth * 1.4); // A4 ratio

  const bg     = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const text   = isDark ? '#e2e8f0' : '#1e293b';
  const muted  = isDark ? '#64748b' : '#94a3b8';
  const tabBg  = isDark ? '#0f172a' : '#f1f5f9';

  const isUploaded = !!block.url?.startsWith('/uploads/');

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploading(true);
      try {
        if (block.url?.startsWith('/uploads/')) await deletePdfFromServer(block.url);
        const { url, name } = await uploadPdfToServer(asset.uri, asset.name);
        onChange({ url, name });
        setExpanded(false);
        if (__DEV__) console.log('✅ PDF uploaded:', url);
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Upload failed', text2: err?.message ?? 'Could not upload PDF.', visibilityTime: 3500, position: 'top' });
        if (__DEV__) console.error('❌ PDF upload error:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleClear = () => {
    if (block.url?.startsWith('/uploads/')) deletePdfFromServer(block.url);
    onChange({ url: '', name: '' });
    setExpanded(false);
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
              backgroundColor: tab === t ? ACCENT : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t ? '#fff' : muted }}>
              {t === 'link' ? '🔗 Link' : '📄 Upload'}
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
                deletePdfFromServer(block.url);
              }
            }}
            placeholder="Paste PDF URL…"
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
              backgroundColor: isDark ? '#2d1010' : '#fff5f5',
              borderWidth: 1.5, borderColor: ACCENT,
            }}>
              <ActivityIndicator color={ACCENT} />
              <Text style={{ fontSize: 13, color: ACCENT, fontWeight: '600' }}>Uploading PDF…</Text>
            </View>
          ) : (
            <Pressable
              onPress={handlePickPdf}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, paddingVertical: 14, borderRadius: 10,
                backgroundColor: pressed ? '#b91c1c' : ACCENT,
              })}
            >
              <Text style={{ fontSize: 20 }}>📄</Text>
              <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>
                {isUploaded ? 'Replace PDF' : 'Choose PDF file'}
              </Text>
            </Pressable>
          )}

          {/* Uploaded badge */}
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

      {/* ── Preview card — expandable inline viewer ── */}
      {block.url ? (
        <View>
          {/* Header */}
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: pressed
                ? (isDark ? '#2d1010' : '#fff5f5')
                : (isDark ? '#1e293b' : '#fff'),
              borderRadius: 12,
              borderBottomLeftRadius: expanded ? 0 : 12,
              borderBottomRightRadius: expanded ? 0 : 12,
              borderWidth: 1.5,
              borderColor: isDark ? '#334155' : '#fecaca',
              borderBottomColor: expanded ? 'transparent' : (isDark ? '#334155' : '#fecaca'),
              padding: 14,
            })}
          >
            <View style={{
              width: 44, height: 52, borderRadius: 6,
              backgroundColor: ACCENT + '18', borderWidth: 1.5, borderColor: ACCENT + '44',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 22 }}>📄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: text }} numberOfLines={2}>
                {block.name || block.url.split('/').pop() || 'PDF Document'}
              </Text>
              <Text style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                {expanded ? 'Tap to collapse' : 'Tap to preview'}
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: ACCENT }}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>

          {/* Inline viewer */}
          {expanded && (
            <View style={{
              width: viewerWidth, height: viewerHeight,
              borderWidth: 1.5, borderTopWidth: 0,
              borderColor: isDark ? '#334155' : '#fecaca',
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
                    backgroundColor: pressed ? ACCENT : ACCENT + '18',
                    borderWidth: 1, borderColor: ACCENT + '44',
                  })}
                >
                  <Text style={{ fontSize: 13 }}>⛶</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>
                    Full screen
                  </Text>
                </Pressable>
              </View>
              <PdfViewer
                url={resolveUrl(block.url)}
                width={viewerWidth}
                height={viewerHeight - 38}
                isDark={isDark}
              />
            </View>
          )}

          {/* Fullscreen modal */}
          <PdfFullscreenModal
            visible={fullscreen}
            url={resolveUrl(block.url)}
            name={block.name || block.url.split('/').pop()}
            isDark={isDark}
            onClose={() => setFullscreen(false)}
          />
        </View>
      ) : (
        /* Empty state */
        <View style={{
          height: 100, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: isDark ? '#1e293b' : '#fff5f5',
          borderWidth: 2, borderColor: isDark ? '#334155' : '#fecaca', borderStyle: 'dashed',
        }}>
          <Text style={{ fontSize: 36 }}>📄</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>Add a PDF</Text>
          <Text style={{ fontSize: 11, color: muted }}>
            {tab === 'link' ? 'Paste a URL above' : 'Choose a PDF file'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default PdfBlockEditor;

