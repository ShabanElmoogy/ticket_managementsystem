import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import type { BlockType } from '../../types/types';
import { BLOCK_TYPES } from './blockTypes';
import PaletteButton from './PaletteButton';

interface Props {
  onAdd: (type: BlockType) => void;
  isDark: boolean;
  templateCount?: number;
  onOpenTemplates?: () => void;
}

const HorizontalPalette: React.FC<Props> = ({ onAdd, isDark, templateCount = 0, onOpenTemplates }) => {
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

        {/* Templates button */}
        {onOpenTemplates && (
          <Pressable
            onPress={onOpenTemplates}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
              backgroundColor: pressed ? '#7c3aed22' : (isDark ? '#1e293b' : '#fff'),
              borderWidth: 1.5,
              borderColor: pressed ? '#7c3aed88' : '#7c3aed55',
              minWidth: 56,
            })}
          >
            <Text style={{ fontSize: 14 }}>📋</Text>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#7c3aed' }}>Templates</Text>
              {templateCount > 0 && (
                <Text style={{ fontSize: 9, color: '#7c3aed', textAlign: 'center' }}>{templateCount}</Text>
              )}
            </View>
          </Pressable>
        )}

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
