import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@/src/constants/tokens';
import { Palette } from '@/src/constants/tokens';
import { useUiStore, type ColorMode } from '@/src/stores/uiStore';

interface ColorModeOption {
  mode:     ColorMode;
  labelKey: string;
  iconName: 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline';
}

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  { mode: 'light',  labelKey: 'onboarding.appearance.light',  iconName: 'sunny-outline' },
  { mode: 'dark',   labelKey: 'onboarding.appearance.dark',   iconName: 'moon-outline' },
  { mode: 'system', labelKey: 'onboarding.appearance.system', iconName: 'phone-portrait-outline' },
];

interface Props {
  resolvedColors: ThemeColors;
  isRtl:          boolean;
}

const AppearanceStep: React.FC<Props> = ({ resolvedColors: c, isRtl }) => {
  const { t }     = useTranslation();
  const colorMode = useUiStore((s) => s.colorMode);
  const textAlign = isRtl ? 'right' : 'left';

  const handleSelect = (mode: ColorMode) => {
    useUiStore.getState().setColorMode(mode);
  };

  return (
    <View style={styles.row}>
      {COLOR_MODE_OPTIONS.map((option) => {
        const isActive = colorMode === option.mode;
        const label    = t(option.labelKey);
        return (
          <Pressable
            key={option.mode}
            onPress={() => handleSelect(option.mode)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }: { pressed: boolean }) => [
              styles.card,
              {
                borderColor:     isActive ? c.interactive.primary : c.border.primary,
                backgroundColor: isActive ? c.interactive.primary + '12' : c.surface.secondary,
                transform:       [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: isActive ? c.interactive.primary + '20' : c.surface.elevated }]}>
              <Ionicons name={option.iconName} size={22} color={isActive ? c.interactive.primary : c.text.secondary} />
            </View>
            <Text style={[styles.label, { color: isActive ? c.interactive.primary : c.text.secondary, textAlign }]}>
              {label}
            </Text>
            {isActive && (
              <View style={[styles.checkBadge, { backgroundColor: c.interactive.primary }]}>
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
  iconWrap:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  label:      { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  checkBadge: { position: 'absolute', top: 8, end: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

export default AppearanceStep;
