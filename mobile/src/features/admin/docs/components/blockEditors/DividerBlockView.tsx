import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { DividerBlock } from '../../types/types';

const DIVIDER_COLORS = ['#e2e8f0','#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#64748b'];
const THICKNESSES = [1, 2, 3, 4];

interface Props { block: DividerBlock; onChange?: (patch: Partial<DividerBlock>) => void; }

const DividerBlockView: React.FC<Props> = ({ block, onChange }) => {
  const c = useThemeColors();
  const [showControls, setShowControls] = useState(false);
  const color     = block.settings?.dividerColor ?? c.border.primary;
  const thickness = block.settings?.dividerThickness ?? 1;

  if (!onChange) {
    return <View style={{ height: thickness, backgroundColor: color, marginVertical: 8, borderRadius: 1 }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={() => setShowControls((v) => !v)} style={{ paddingVertical: 8 }}>
        <View style={{ height: thickness, backgroundColor: color, borderRadius: thickness / 2 }} />
        <Text style={{ fontSize: 10, color: c.text.muted, textAlign: 'center', marginTop: 4 }}>
          {showControls ? 'Tap to hide controls' : 'Tap to customize'}
        </Text>
      </Pressable>

      {showControls && (
        <View style={{
          borderRadius: 10, padding: 12, gap: 10,
          backgroundColor: c.surface.tertiary,
          borderWidth: 1, borderColor: c.border.primary,
        }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Color
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row' }}>
              {DIVIDER_COLORS.map((col) => (
                <Pressable
                  key={col}
                  onPress={() => onChange({ settings: { ...block.settings, dividerColor: col } })}
                  style={{
                    width: 28, height: 28, borderRadius: 14, backgroundColor: col,
                    borderWidth: 3, borderColor: color === col ? '#fff' : 'transparent',
                  }}
                />
              ))}
            </ScrollView>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Thickness
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {THICKNESSES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => onChange({ settings: { ...block.settings, dividerThickness: t } })}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                    backgroundColor: thickness === t ? color : c.surface.elevated,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: thickness === t ? '#fff' : c.text.muted }}>
                    {t}px
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DividerBlockView;
