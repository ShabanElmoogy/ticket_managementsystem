import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import type { DocBlock, CalloutType } from '../types/types';

const CALLOUT_CFG: Record<CalloutType, { emoji: string; color: string; bg: string; darkBg: string }> = {
  info:    { emoji: 'ℹ️', color: '#3b82f6', bg: '#eff6ff', darkBg: 'rgba(59,130,246,0.1)' },
  warning: { emoji: '⚠️', color: '#f59e0b', bg: '#fffbeb', darkBg: 'rgba(245,158,11,0.1)' },
  success: { emoji: '✅', color: '#10b981', bg: '#f0fdf4', darkBg: 'rgba(16,185,129,0.1)' },
  error:   { emoji: '❌', color: '#ef4444', bg: '#fef2f2', darkBg: 'rgba(239,68,68,0.1)' },
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

interface Props { blocks: DocBlock[]; isDark: boolean; }

const DocPreview: React.FC<Props> = ({ blocks, isDark }) => {
  const [openToggles, setOpenToggles] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, number>>({});
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({});

  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  const renderBlock = (block: DocBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <Text key={block.id} style={{
            fontSize: 22, fontWeight: '700',
            color: block.settings?.color ?? textColor,
            textAlign: block.settings?.align ?? 'left',
            marginBottom: 8,
          }}>
            {block.text}
          </Text>
        );

      case 'text':
        return (
          <Text key={block.id} style={{
            fontSize: 14, lineHeight: 22,
            color: block.settings?.color ?? textColor,
            textAlign: block.settings?.align ?? 'left',
            marginBottom: 8,
          }}>
            {stripHtml(block.html)}
          </Text>
        );

      case 'divider':
        return (
          <View key={block.id} style={{
            height: block.settings?.dividerThickness ?? 1,
            backgroundColor: block.settings?.dividerColor ?? borderColor,
            marginVertical: 12,
          }} />
        );

      case 'image':
        return (
          <View key={block.id} style={{ marginBottom: 12 }}>
            {block.url ? (
              <Image source={{ uri: block.url }} style={{ width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' }} />
            ) : (
              <View style={{ height: 100, backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>🖼️</Text>
              </View>
            )}
            {block.caption ? (
              <Text style={{ fontSize: 12, color: mutedColor, textAlign: 'center', marginTop: 4 }}>{block.caption}</Text>
            ) : null}
          </View>
        );

      case 'video':
        return (
          <View key={block.id} style={{ marginBottom: 12 }}>
            <View style={{
              height: 120, backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              borderRadius: 8, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor,
            }}>
              <Text style={{ fontSize: 28 }}>🎬</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 4 }} numberOfLines={1}>{block.url || 'No URL'}</Text>
            </View>
            {block.caption ? (
              <Text style={{ fontSize: 12, color: mutedColor, textAlign: 'center', marginTop: 4 }}>{block.caption}</Text>
            ) : null}
          </View>
        );

      case 'bulletedList':
        return (
          <View key={block.id} style={{ marginBottom: 8 }}>
            {block.title ? <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginBottom: 4 }}>{block.title}</Text> : null}
            {block.items.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 3 }}>
                <Text style={{ color: mutedColor, fontSize: 16, lineHeight: 20 }}>•</Text>
                <Text style={{ flex: 1, fontSize: 14, color: textColor, lineHeight: 20 }}>{item}</Text>
              </View>
            ))}
          </View>
        );

      case 'numberedList':
        return (
          <View key={block.id} style={{ marginBottom: 8 }}>
            {block.title ? <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginBottom: 4 }}>{block.title}</Text> : null}
            {block.items.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 3 }}>
                <Text style={{ color: mutedColor, fontSize: 13, width: 20, lineHeight: 20 }}>{i + 1}.</Text>
                <Text style={{ flex: 1, fontSize: 14, color: textColor, lineHeight: 20 }}>{item}</Text>
              </View>
            ))}
          </View>
        );

      case 'code':
        return (
          <View key={block.id} style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor }}>
            <View style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, color: mutedColor, fontWeight: '600' }}>{block.language}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={{
                fontFamily: 'monospace', fontSize: 13, lineHeight: 20,
                color: isDark ? '#e2e8f0' : '#1e293b',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                padding: 12,
              }}>
                {block.code}
              </Text>
            </ScrollView>
          </View>
        );

      case 'quote':
        return (
          <View key={block.id} style={{ borderLeftWidth: 3, borderLeftColor: '#3b82f6', paddingLeft: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 15, fontStyle: 'italic', color: textColor, lineHeight: 22 }}>{block.text}</Text>
            {block.attribution ? (
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}>— {block.attribution}</Text>
            ) : null}
          </View>
        );

      case 'callout': {
        const cfg = CALLOUT_CFG[block.calloutType];
        return (
          <View key={block.id} style={{
            flexDirection: 'row', gap: 10, padding: 12, borderRadius: 8, marginBottom: 8,
            backgroundColor: isDark ? cfg.darkBg : cfg.bg,
            borderWidth: 1, borderColor: cfg.color + '44',
          }}>
            <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
            <Text style={{ flex: 1, fontSize: 14, color: textColor, lineHeight: 20 }}>{block.text}</Text>
          </View>
        );
      }

      case 'table':
        return (
          <ScrollView key={block.id} horizontal showsHorizontalScrollIndicator style={{ marginBottom: 8 }}>
            <View>
              <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                {block.headers.map((h, i) => (
                  <View key={i} style={{ minWidth: 90, padding: 8, borderWidth: 1, borderColor }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{h}</Text>
                  </View>
                ))}
              </View>
              {block.rows.map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row', backgroundColor: ri % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
                  {row.map((cell, ci) => (
                    <View key={ci} style={{ minWidth: 90, padding: 8, borderWidth: 1, borderColor }}>
                      <Text style={{ fontSize: 12, color: textColor }}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        );

      case 'toggle': {
        const isOpen = openToggles[block.id];
        return (
          <View key={block.id} style={{ marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor, overflow: 'hidden' }}>
            <Pressable
              onPress={() => setOpenToggles((s) => ({ ...s, [block.id]: !s[block.id] }))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}
            >
              <Text style={{ fontSize: 12, color: mutedColor }}>{isOpen ? '▼' : '▶'}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: textColor }}>{block.summary}</Text>
            </Pressable>
            {isOpen && (
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 14, color: textColor, lineHeight: 20 }}>{block.content}</Text>
              </View>
            )}
          </View>
        );
      }

      case 'tabs': {
        const activeIdx = activeTabs[block.id] ?? 0;
        const tab = block.tabs[activeIdx];
        return (
          <View key={block.id} style={{ marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor, overflow: 'hidden' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
              contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 4, gap: 2 }}
            >
              {block.tabs.map((t, idx) => (
                <Pressable
                  key={t.id}
                  onPress={() => setActiveTabs((s) => ({ ...s, [block.id]: idx }))}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                    backgroundColor: activeIdx === idx ? '#3b82f6' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: activeIdx === idx ? '#fff' : mutedColor }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {tab && (
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 14, color: textColor, lineHeight: 20 }}>{tab.content}</Text>
              </View>
            )}
          </View>
        );
      }

      case 'videoCarousel': {
        const idx = carouselIdx[block.id] ?? 0;
        const video = block.videos[idx];
        if (!block.videos.length) return null;
        return (
          <View key={block.id} style={{ marginBottom: 8 }}>
            <View style={{
              height: 120, backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              borderRadius: 8, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor,
            }}>
              <Text style={{ fontSize: 24 }}>🎬</Text>
              {video && <Text style={{ fontSize: 13, color: textColor, marginTop: 4 }}>{video.title}</Text>}
            </View>
            {block.videos.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                <Pressable onPress={() => setCarouselIdx((s) => ({ ...s, [block.id]: Math.max(0, idx - 1) }))}>
                  <Text style={{ fontSize: 20, color: idx === 0 ? mutedColor : '#3b82f6' }}>‹</Text>
                </Pressable>
                <Text style={{ fontSize: 13, color: mutedColor }}>{idx + 1} / {block.videos.length}</Text>
                <Pressable onPress={() => setCarouselIdx((s) => ({ ...s, [block.id]: Math.min(block.videos.length - 1, idx + 1) }))}>
                  <Text style={{ fontSize: 20, color: idx === block.videos.length - 1 ? mutedColor : '#3b82f6' }}>›</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      }

      default:
        return null;
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {blocks.map(renderBlock)}
    </ScrollView>
  );
};

export default DocPreview;
