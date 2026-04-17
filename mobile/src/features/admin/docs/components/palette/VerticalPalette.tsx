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
 * Vertical sidebar of block type buttons.
 * Shown on the right side of the editor on wide screens.
 */
const VerticalPalette: React.FC<Props> = ({ onAdd, isDark }) => {
  const bg          = isDark ? '#0f172a' : '#f8fafc';
  const stripBorder = isDark ? '#1e293b' : '#e2e8f0';
  const btnBg       = isDark ? '#1e293b' : '#ffffff';
  const btnBorder   = isDark ? '#334155' : '#e2e8f0';
  const labelColor  = isDark ? '#94a3b8' : '#64748b';

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
        {BLOCK_TYPES.map((def) => (
          <PaletteButton
            key={def.type}
            def={def}
            onAdd={onAdd}
            btnBg={btnBg}
            btnBorder={btnBorder}
            labelColor={labelColor}
            iconSize={30}
            labelFontSize={9}
            variant="vertical"
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default VerticalPalette;
