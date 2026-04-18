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

const VerticalPalette: React.FC<Props> = ({ onAdd, isDark, templateCount = 0, onOpenTemplates }) => {
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
        {/* Templates button */}
        {onOpenTemplates && (
          <Pressable
            onPress={onOpenTemplates}
            style={({ pressed }) => ({
              alignItems: 'center', justifyContent: 'center', gap: 3,
              paddingVertical: 8, borderRadius: 10,
              backgroundColor: pressed ? '#7c3aed22' : btnBg,
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
