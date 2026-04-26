import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { BLOCK_META } from '@/src/features/admin/docs/components/editor/blockMeta';
import type { BlockType } from '@/src/features/admin/docs/types/types';

export const QUICK_BLOCKS: BlockType[] = [
  'text', 'heading', 'image', 'video', 'bulletedList',
  'numberedList', 'code', 'quote', 'callout', 'divider',
  'table', 'toggle', 'tabs', 'pdf', 'excel',
  'videoCarousel', 'imageCarousel',
];

interface Props {
  isDark: boolean;
  onPick: (type: BlockType) => void;
  onClose: () => void;
}

/**
 * Modal grid of block types — shown when the user taps an InsertDivider.
 * Picking a type calls onPick(type) then onClose().
 */
const MiniBlockPicker: React.FC<Props> = ({ isDark, onPick, onClose }) => (
  <Modal transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
      onPress={onClose}
    >
      <Pressable
        style={{
          backgroundColor: isDark ? '#1e293b' : '#fff',
          borderRadius: 14,
          borderWidth: 1.5, borderColor: isDark ? '#475569' : '#e2e8f0',
          padding: 14, width: 300, maxHeight: 420,
          shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.5 : 0.15, shadowRadius: 16, elevation: 12,
        }}
        onPress={(e) => e.stopPropagation()}
      >
        <Text style={{
          fontSize: 11, fontWeight: '800', letterSpacing: 0.8,
          color: isDark ? '#64748b' : '#94a3b8',
          marginBottom: 12, textTransform: 'uppercase',
        }}>
          Insert block
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {QUICK_BLOCKS.map((type) => {
            const meta = BLOCK_META[type] ?? { label: type, emoji: '□', color: '#64748b' };
            return (
              <Pressable
                key={type}
                onPress={() => { onPick(type); onClose(); }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
                  backgroundColor: pressed
                    ? meta.color + '44'
                    : meta.color + (isDark ? '28' : '15'),
                  borderWidth: 1,
                  borderColor: meta.color + (isDark ? '55' : '33'),
                })}
              >
                <Text style={{ fontSize: 14, color: meta.color }}>{meta.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: meta.color }}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

export default MiniBlockPicker;
