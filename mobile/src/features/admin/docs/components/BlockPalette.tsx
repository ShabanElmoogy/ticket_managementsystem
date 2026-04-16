import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { BlockType } from '../types/types';

const BLOCK_TYPES: { type: BlockType; icon: string; label: string }[] = [
  { type: 'heading',       icon: 'H',  label: 'Heading'       },
  { type: 'text',          icon: '¶',  label: 'Text'          },
  { type: 'divider',       icon: '—',  label: 'Divider'       },
  { type: 'bulletedList',  icon: '•',  label: 'Bullet List'   },
  { type: 'numberedList',  icon: '1.', label: 'Numbered List' },
  { type: 'code',          icon: '<>', label: 'Code'          },
  { type: 'image',         icon: '🖼', label: 'Image'         },
  { type: 'video',         icon: '▶',  label: 'Video'         },
  { type: 'quote',         icon: '"',  label: 'Quote'         },
  { type: 'callout',       icon: '!',  label: 'Callout'       },
  { type: 'table',         icon: '⊞',  label: 'Table'         },
  { type: 'toggle',        icon: '▸',  label: 'Toggle'        },
  { type: 'tabs',          icon: '⊟',  label: 'Tabs'          },
  { type: 'videoCarousel', icon: '🎬', label: 'Carousel'      },
];

interface Props {
  onAdd: (type: BlockType) => void;
  isDark: boolean;
  horizontal?: boolean;
}

const BlockPalette: React.FC<Props> = ({ onAdd, isDark, horizontal = false }) => {
  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
        }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, gap: 4, flexDirection: 'row' }}
      >
        {BLOCK_TYPES.map(({ type, icon, label }) => (
          <Pressable
            key={type}
            onPress={() => onAdd(type)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : '#fff',
              borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
            }}
          >
            <Text style={{ fontSize: 13, color: '#3b82f6', fontWeight: '700', minWidth: 16, textAlign: 'center' }}>
              {icon}
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#e2e8f0' : '#374151', fontWeight: '500' }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={{
      width: 140,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderLeftWidth: 1,
      borderLeftColor: isDark ? '#1e293b' : '#e2e8f0',
    }}>
      <Text style={{
        fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
        color: isDark ? '#475569' : '#9ca3af',
        paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6,
      }}>
        Add Block
      </Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        {BLOCK_TYPES.map(({ type, icon, label }) => (
          <Pressable
            key={type}
            onPress={() => onAdd(type)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 12, paddingVertical: 8,
              backgroundColor: pressed ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent',
            })}
          >
            <Text style={{ fontSize: 13, color: '#3b82f6', fontWeight: '700', width: 20, textAlign: 'center' }}>
              {icon}
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#e2e8f0' : '#374151' }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default BlockPalette;
