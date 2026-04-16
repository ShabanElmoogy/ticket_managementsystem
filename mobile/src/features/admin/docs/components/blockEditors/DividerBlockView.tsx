import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { DividerBlock } from '../../types/types';

const DIVIDER_COLORS = ['#e2e8f0','#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#64748b'];
const THICKNESSES = [1, 2, 3, 4];

interface Props { block: DividerBlock; isDark: boolean; onChange?: (patch: Partial<DividerBlock>) => void; }

const DividerBlockView: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [showControls, setShowControls] = useState(false);
  const color     = block.settings?.dividerColor ?? (isDark ? '#334155' : '#e2e8f0');
  const thickness = block.settings?.dividerThickness ?? 1;

  if (!onChange) {
    return <View style={{ height: thickness, backgroundColor: color, marginVertical: 8, borderRadius: 1 }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {/* Divider preview */}
      <Pressable onPress={() => setShowControls((v) => !v)} style={{ paddingVertical: 8 }}>
        <View style={{ height: thickness, backgroundColor: color, borderRadius: thickness / 2 }} />
        <Text style={{ fontSize: 10, color: isDark ? '#334155' : '#cbd5e1', textAlign: 'center', marginTop: 4 }}>
          {showControls ? 'Tap to hide controls' : 'Tap to customize'}
        </Text>
      </Pressable>

      {/* Controls */}
      {showControls && (
        <View style={{
          borderRadius: 10, padding: 12, gap: 10,
          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
          borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
        }}>
          {/* Color */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Color
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row' }}>
              {DIVIDER_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => onChange({ settings: { ...block.settings, dividerColor: c } })}
                  style={{
                    width: 28, height: 28, borderRadius: 14, backgroundColor: c,
                    borderWidth: 3, borderColor: color === c ? '#fff' : 'transparent',
                    shadowColor: color === c ? c : 'transparent',
                    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
                  }}
                />
              ))}
            </ScrollView>
          </View>

          {/* Thickness */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Thickness
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {THICKNESSES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => onChange({ settings: { ...block.settings, dividerThickness: t } })}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                    backgroundColor: thickness === t ? color : (isDark ? '#334155' : '#e2e8f0'),
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: thickness === t ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }}>
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
