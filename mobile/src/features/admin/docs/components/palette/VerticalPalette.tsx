import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { BlockType } from '@/src/features/admin/docs/types/types';
import { BLOCK_TYPES } from './blockTypes';
import PaletteButton from './PaletteButton';

interface Props {
  onAdd: (type: BlockType) => void;
  templateCount?: number;
  onOpenTemplates?: () => void;
}

const VerticalPalette: React.FC<Props> = ({ onAdd, templateCount = 0, onOpenTemplates }) => {
  const c = useThemeColors();

  return (
    <View style={{ width: 80, backgroundColor: c.surface.secondary, borderStartWidth: 1, borderStartColor: c.border.primary }}>
      <View style={{ paddingTop: 12, paddingBottom: 6, alignItems: 'center' }}>
        <Text style={{
          fontSize: 9, fontWeight: '800', textTransform: 'uppercase',
          letterSpacing: 0.8, color: c.text.muted,
        }}>
          ADD
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 6, gap: 5 }}
        showsVerticalScrollIndicator={false}
      >
        {onOpenTemplates && (
          <Pressable
            onPress={onOpenTemplates}
            style={({ pressed }) => ({
              alignItems: 'center', justifyContent: 'center', gap: 3,
              paddingVertical: 8, borderRadius: 10,
              backgroundColor: pressed ? '#7c3aed22' : c.surface.card,
              borderWidth: 1.5,
              borderColor: pressed ? '#7c3aed88' : '#7c3aed55',
            })}
          >
            <View style={{
              width: 30, height: 30, borderRadius: 9,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#7c3aed22', borderWidth: 1.5, borderColor: '#7c3aed55',
            }}>
              <Text style={{ fontSize: 15 }}>📋</Text>
            </View>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#7c3aed', textAlign: 'center' }}>
              {templateCount > 0 ? `${templateCount}` : 'Tmpl'}
            </Text>
          </Pressable>
        )}

        {BLOCK_TYPES.map((def) => (
          <PaletteButton
            key={def.type}
            def={def}
            onAdd={onAdd}
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
