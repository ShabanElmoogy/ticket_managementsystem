import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated } = require('react-native') as { Animated: any };
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@/src/constants/tokens';
import { Palette } from '@/src/constants/tokens';
import { useUiStore, type ColorMode } from '@/src/stores/uiStore';

interface ColorModeOption {
  mode:     ColorMode;
  labelKey: string;
  iconName: 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline';
  activeIcon: 'sunny' | 'moon' | 'phone-portrait';
}

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  { mode: 'light',  labelKey: 'onboarding.appearance.light',  iconName: 'sunny-outline',          activeIcon: 'sunny'          },
  { mode: 'dark',   labelKey: 'onboarding.appearance.dark',   iconName: 'moon-outline',           activeIcon: 'moon'           },
  { mode: 'system', labelKey: 'onboarding.appearance.system', iconName: 'phone-portrait-outline', activeIcon: 'phone-portrait' },
];

interface Props {
  resolvedColors: ThemeColors;
  isRtl:          boolean;
}

interface PillProps {
  option:         ColorModeOption;
  isActive:       boolean;
  label:          string;
  resolvedColors: ThemeColors;
  onPress:        () => void;
}

const AppearancePill: React.FC<PillProps> = ({ option, isActive, label, resolvedColors: c, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue:         isActive ? 1.02 : 1,
      useNativeDriver: true,
      speed:           20,
      bounciness:      4,
    }).start();
  }, [isActive]);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: isActive ? 1.02 : 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isActive }}
        style={[
          styles.pill,
          {
            backgroundColor: isActive ? c.interactive.primary : 'transparent',
            borderColor:     isActive ? c.interactive.primary : c.border.primary,
            shadowColor:     c.interactive.primary,
            shadowOpacity:   isActive ? 0.20 : 0,
            shadowRadius:    8,
            shadowOffset:    { width: 0, height: 3 },
            elevation:       isActive ? 4 : 0,
          },
        ]}
      >
        <Ionicons
          name={isActive ? option.activeIcon : option.iconName}
          size={16}
          color={isActive ? Palette.white : c.text.secondary}
        />
        <Text style={[styles.label, { color: isActive ? Palette.white : c.text.secondary }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const AppearanceStep: React.FC<Props> = ({ resolvedColors: c, isRtl }) => {
  const { t }     = useTranslation();
  const colorMode = useUiStore((s) => s.colorMode);

  return (
    <View style={[styles.row, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
      {COLOR_MODE_OPTIONS.map((option) => (
        <View key={option.mode} style={{ flex: 1 }}>
          <AppearancePill
            option={option}
            isActive={colorMode === option.mode}
            label={t(option.labelKey)}
            resolvedColors={c}
            onPress={() => useUiStore.getState().setColorMode(option.mode)}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               6,
    paddingVertical:   10,
    paddingHorizontal: 10,
    borderRadius:      99,
    borderWidth:       1.5,
  },
  label: {
    fontSize:      12,
    fontWeight:    '600',
    letterSpacing: 0.2,
    flexShrink:    1,
  },
});

export default AppearanceStep;
