import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { ToggleBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props {
  block: ToggleBlock;
  colors: PreviewColors;
  isOpen: boolean;
  onToggle: () => void;
}

const PreviewToggle: React.FC<Props> = ({ block, colors, isOpen, onToggle }) => {
  const c = useThemeColors();

  return (
    <View style={{ marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.borderColor, overflow: 'hidden' }}>
      <Pressable
        onPress={onToggle}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
          backgroundColor: c.surface.tertiary,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.mutedColor }}>{isOpen ? '▼' : '▶'}</Text>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textColor }}>{block.summary}</Text>
      </Pressable>
      {isOpen && (
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 14, color: colors.textColor, lineHeight: 20 }}>{block.content}</Text>
        </View>
      )}
    </View>
  );
};

export default PreviewToggle;
