import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { BlockType } from '../../types/types';
import { BLOCK_TYPES } from './blockTypes';
import PaletteButton from './PaletteButton';

interface Props {
  onAdd: (type: BlockType) => void;
  isDark: boolean;
}

/**
 * Horizontal scrolling strip of block type buttons.
 * Shown at the bottom of the editor on narrow screens.
 */
const HorizontalPalette: React.FC<Props> = ({ onAdd, isDark }) => {
  const bg          = isDark ? '#0f172a' : '#f8fafc';
  const stripBorder = isDark ? '#1e293b' : '#e2e8f0';
  const btnBg       = isDark ? '#1e293b' : '#ffffff';
  const btnBorder   = isDark ? '#334155' : '#e2e8f0';
  const labelColor  = isDark ? '#94a3b8' : '#64748b';

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
        <Text style={{
          fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
          color: isDark ? '#334155' : '#cbd5e1',
          textTransform: 'uppercase', marginRight: 2,
        }}>
          ADD
        </Text>

        {BLOCK_TYPES.map((def) => (
          <PaletteButton
            key={def.type}
            def={def}
            onAdd={onAdd}
            btnBg={btnBg}
            btnBorder={btnBorder}
            labelColor={labelColor}
            iconSize={26}
            labelFontSize={10}
            variant="horizontal"
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default HorizontalPalette;
