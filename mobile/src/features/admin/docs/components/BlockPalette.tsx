import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { BlockType } from '../types/types';

interface BlockDef { type: BlockType; emoji: string; label: string; color: string }

const BLOCK_TYPES: BlockDef[] = [
  { type: 'heading',       emoji: '𝐇',  label: 'Heading',      color: '#6366f1' },
  { type: 'text',          emoji: '¶',  label: 'Text',         color: '#3b82f6' },
  { type: 'bulletedList',  emoji: '•',  label: 'Bullet List',  color: '#10b981' },
  { type: 'numberedList',  emoji: '①',  label: 'Numbered',     color: '#10b981' },
  { type: 'code',          emoji: '</>',label: 'Code',         color: '#f59e0b' },
  { type: 'quote',         emoji: '❝',  label: 'Quote',        color: '#8b5cf6' },
  { type: 'callout',       emoji: '💡', label: 'Callout',      color: '#f59e0b' },
  { type: 'image',         emoji: '🖼️', label: 'Image',        color: '#ec4899' },
  { type: 'video',         emoji: '▶️', label: 'Video',        color: '#ef4444' },
  { type: 'table',         emoji: '⊞',  label: 'Table',        color: '#0ea5e9' },
  { type: 'toggle',        emoji: '▸',  label: 'Toggle',       color: '#64748b' },
  { type: 'tabs',          emoji: '⊟',  label: 'Tabs',         color: '#0ea5e9' },
  { type: 'divider',       emoji: '—',  label: 'Divider',      color: '#94a3b8' },
  { type: 'videoCarousel', emoji: '🎬', label: 'Carousel',     color: '#ef4444' },
];

interface Props {
  onAdd: (type: BlockType) => void;
  isDark: boolean;
  horizontal?: boolean;
}

const BlockPalette: React.FC<Props> = ({ onAdd, isDark, horizontal = false }) => {
  const bg     = isDark ? '#0f172a' : '#f8fafc';
  const border = isDark ? '#1e293b' : '#e2e8f0';

  if (horizontal) {
    return (
      <View style={{ backgroundColor: bg, borderTopWidth: 1, borderTopColor: border }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8, gap: 6, flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#475569' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>
            + Block
          </Text>
          {BLOCK_TYPES.map(({ type, emoji, label, color }) => (
            <Pressable
              key={type}
              onPress={() => onAdd(type)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
                backgroundColor: pressed
                  ? color + '22'
                  : isDark ? '#1e293b' : '#fff',
                borderWidth: 1,
                borderColor: pressed ? color + '66' : (isDark ? '#334155' : '#e5e7eb'),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0 : 0.04,
                shadowRadius: 2,
                elevation: isDark ? 0 : 1,
              })}
            >
              <Text style={{ fontSize: 14, minWidth: 18, textAlign: 'center' }}>{emoji}</Text>
              <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#374151', fontWeight: '500' }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Vertical sidebar
  return (
    <View style={{ width: 148, backgroundColor: bg, borderLeftWidth: 1, borderLeftColor: border }}>
      <View style={{ paddingHorizontal: 12, paddingTop: 14, paddingBottom: 8 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: isDark ? '#475569' : '#94a3b8' }}>
          Add Block
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 6 }}>
        {BLOCK_TYPES.map(({ type, emoji, label, color }) => (
          <Pressable
            key={type}
            onPress={() => onAdd(type)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 8, paddingVertical: 9,
              borderRadius: 8, marginBottom: 1,
              backgroundColor: pressed ? color + '18' : 'transparent',
            })}
          >
            <View style={{
              width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
              backgroundColor: color + '18',
            }}>
              <Text style={{ fontSize: 13 }}>{emoji}</Text>
            </View>
            <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#374151', fontWeight: '500', flex: 1 }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default BlockPalette;
