import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { BLOCK_META } from '@/src/features/admin/docs/components/editor/blockMeta';
import type { BlockType } from '@/src/features/admin/docs/types/types';

export const QUICK_BLOCKS: BlockType[] = [
  'text', 'heading', 'image', 'video', 'bulletedList',
  'numberedList', 'code', 'quote', 'callout', 'divider',
  'table', 'toggle', 'tabs', 'pdf', 'excel',
  'videoCarousel', 'imageCarousel',
];

interface Props {
  onPick: (type: BlockType) => void;
  onClose: () => void;
}

const MiniBlockPicker: React.FC<Props> = ({ onPick, onClose }) => {
  const c = useThemeColors();
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: c.surface.card,
            borderRadius: 14,
            borderWidth: 1.5, borderColor: c.border.secondary,
            padding: 14, width: 300, maxHeight: 420,
            shadowColor: c.shadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 1, shadowRadius: 16, elevation: 12,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={{
            fontSize: 11, fontWeight: '800', letterSpacing: 0.8,
            color: c.text.muted,
            marginBottom: 12, textTransform: 'uppercase',
          }}>
            Insert block
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_BLOCKS.map((type) => {
              const meta = BLOCK_META[type] ?? { label: type, emoji: '□', color: c.text.muted };
              return (
                <Pressable
                  key={type}
                  onPress={() => { onPick(type); onClose(); }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
                    backgroundColor: pressed ? meta.color + '44' : meta.color + '20',
                    borderWidth: 1,
                    borderColor: meta.color + '40',
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
};

export default MiniBlockPicker;
