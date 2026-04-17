import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { BlockType } from '../types/types';

interface BlockDef { type: BlockType; icon: string; label: string; color: string; isEmoji?: boolean }

const BLOCK_TYPES: BlockDef[] = [
  { type: 'heading',       icon: 'H',    label: 'Heading',     color: '#6366f1' },
  { type: 'text',          icon: 'T',    label: 'Text',        color: '#3b82f6' },
  { type: 'bulletedList',  icon: '•',    label: 'Bullet',      color: '#10b981' },
  { type: 'numberedList',  icon: '1.',   label: 'Numbered',    color: '#10b981' },
  { type: 'code',          icon: '</>',  label: 'Code',        color: '#f59e0b' },
  { type: 'quote',         icon: '"',    label: 'Quote',       color: '#8b5cf6' },
  { type: 'callout',       icon: '💡',   label: 'Callout',     color: '#f59e0b', isEmoji: true },
  { type: 'image',         icon: '🖼️',   label: 'Image',       color: '#ec4899', isEmoji: true },
  { type: 'video',         icon: '▶',    label: 'Video',       color: '#ef4444' },
  { type: 'table',         icon: '⊞',    label: 'Table',       color: '#0ea5e9' },
  { type: 'toggle',        icon: '▸',    label: 'Toggle',      color: '#64748b' },
  { type: 'tabs',          icon: '⊟',    label: 'Tabs',        color: '#0ea5e9' },
  { type: 'divider',       icon: '—',    label: 'Divider',     color: '#94a3b8' },
  { type: 'videoCarousel', icon: '🎬',   label: 'Vid Carousel', color: '#ef4444', isEmoji: true },
  { type: 'imageCarousel', icon: '🖼️',   label: 'Img Carousel', color: '#ec4899', isEmoji: true },
];

interface Props {
  onAdd: (type: BlockType) => void;
  isDark: boolean;
  horizontal?: boolean;
}

// Centered icon badge
const IconBadge: React.FC<{ icon: string; color: string; isEmoji?: boolean; size: number }> = ({
  icon, color, isEmoji, size,
}) => (
  <View style={{
    width: size, height: size,
    borderRadius: size * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color + '22',
    borderWidth: 1.5,
    borderColor: color + '55',
  }}>
    <Text style={{
      fontSize: isEmoji ? size * 0.5 : size * 0.44,
      fontWeight: isEmoji ? undefined : '800',
      color: isEmoji ? undefined : color,
      textAlign: 'center',
      // prevent line-height from pushing text off-center
      lineHeight: size * 0.6,
      includeFontPadding: false,
    }}>
      {icon}
    </Text>
  </View>
);

const BlockPalette: React.FC<Props> = ({ onAdd, isDark, horizontal = false }) => {
  const bg          = isDark ? '#0f172a' : '#f8fafc';
  const stripBorder = isDark ? '#1e293b' : '#e2e8f0';
  const btnBg       = isDark ? '#1e293b' : '#ffffff';
  const btnBorder   = isDark ? '#334155' : '#e2e8f0';
  const labelColor  = isDark ? '#94a3b8' : '#64748b';

  if (horizontal) {
    return (
      <View style={{ backgroundColor: bg, borderTopWidth: 1, borderTopColor: stripBorder }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingVertical: 8,
            gap: 6,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* Label */}
          <Text style={{
            fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
            color: isDark ? '#334155' : '#cbd5e1',
            textTransform: 'uppercase', marginRight: 2,
          }}>
            ADD
          </Text>

          {BLOCK_TYPES.map(({ type, icon, label, color, isEmoji }) => (
            <Pressable
              key={type}
              onPress={() => onAdd(type)}
              style={({ pressed }) => ({
                // vertical layout: icon centered on top, label below
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: pressed ? color + '22' : btnBg,
                borderWidth: 1.5,
                borderColor: pressed ? color + '88' : btnBorder,
                minWidth: 56,
              })}
            >
              <IconBadge icon={icon} color={color} isEmoji={isEmoji} size={26} />
              <Text style={{
                fontSize: 10, fontWeight: '600',
                color: labelColor,
                textAlign: 'center',
              }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Vertical sidebar — icon centered, label below
  return (
    <View style={{ width: 80, backgroundColor: bg, borderLeftWidth: 1, borderLeftColor: stripBorder }}>
      <View style={{ paddingTop: 12, paddingBottom: 6, alignItems: 'center' }}>
        <Text style={{
          fontSize: 9, fontWeight: '800', textTransform: 'uppercase',
          letterSpacing: 0.8, color: isDark ? '#334155' : '#cbd5e1',
        }}>
          ADD
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 6, gap: 5 }}
        showsVerticalScrollIndicator={false}
      >
        {BLOCK_TYPES.map(({ type, icon, label, color, isEmoji }) => (
          <Pressable
            key={type}
            onPress={() => onAdd(type)}
            style={({ pressed }) => ({
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: pressed ? color + '22' : btnBg,
              borderWidth: 1.5,
              borderColor: pressed ? color + '88' : btnBorder,
            })}
          >
            <IconBadge icon={icon} color={color} isEmoji={isEmoji} size={30} />
            <Text style={{
              fontSize: 9, fontWeight: '600',
              color: labelColor,
              textAlign: 'center',
            }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default BlockPalette;
