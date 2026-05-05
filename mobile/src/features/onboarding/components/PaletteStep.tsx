import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ThemeColors, PaletteOption } from '@/src/constants/tokens';
import { Palette } from '@/src/constants/tokens';
import { useUiStore } from '@/src/stores/uiStore';

interface PaletteOptionConfig {
  option:       PaletteOption;
  labelKey:     string;
  primaryColor: string;
}

const PALETTE_OPTIONS: PaletteOptionConfig[] = [
  { option: 'blue',   labelKey: 'onboarding.palette.blue',   primaryColor: Palette.blue600    },
  { option: 'orange', labelKey: 'onboarding.palette.orange', primaryColor: Palette.orange500  },
  { option: 'green',  labelKey: 'onboarding.palette.green',  primaryColor: Palette.emerald600 },
];

interface Props {
  resolvedColors: ThemeColors;
  isRtl:          boolean;
}

const PaletteStep: React.FC<Props> = ({ resolvedColors: c, isRtl }) => {
  const { t }         = useTranslation();
  const paletteOption = useUiStore((s) => s.paletteOption);
  const textAlign     = isRtl ? 'right' : 'left';

  const handleSelect = (option: PaletteOption) => {
    useUiStore.getState().setPaletteOption(option);
  };

  return (
    <View style={styles.row}>
      {PALETTE_OPTIONS.map((config) => {
        const isActive = paletteOption === config.option;
        const label    = t(config.labelKey);
        return (
          <Pressable
            key={config.option}
            onPress={() => handleSelect(config.option)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }: { pressed: boolean }) => [
              styles.card,
              {
                borderColor:     isActive ? config.primaryColor : c.border.primary,
                backgroundColor: isActive ? config.primaryColor + '12' : c.surface.secondary,
                transform:       [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: config.primaryColor }]} />
            <Text style={[styles.label, { color: isActive ? config.primaryColor : c.text.secondary, textAlign }]}>
              {label}
            </Text>
            {isActive && (
              <View style={[styles.checkBadge, { backgroundColor: config.primaryColor }]}>
                <Ionicons name="checkmark" size={10} color={Palette.white} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', gap: 10 },
  card:       { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 16, paddingStart: 10, paddingEnd: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  swatch:     { width: 40, height: 40, borderRadius: 20, marginBottom: 8 },
  label:      { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  checkBadge: { position: 'absolute', top: 8, end: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

export default PaletteStep;
