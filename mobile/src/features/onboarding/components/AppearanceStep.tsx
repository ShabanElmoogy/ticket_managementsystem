import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
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
  { mode: 'light',  labelKey: 'onboarding.appearance.light',  iconName: 'sunny-outline'           },
  { mode: 'dark',   labelKey: 'onboarding.appearance.dark',   iconName: 'moon-outline'            },
  { mode: 'system', labelKey: 'onboarding.appearance.system', iconName: 'phone-portrait-outline'  },
];

interface Props {
  resolvedColors: ThemeColors;
  isRtl:          boolean;
}

interface CardProps {
  option:         ColorModeOption;
  isActive:       boolean;
  label:          string;
  resolvedColors: ThemeColors;
  isRtl:          boolean;
  onPress:        () => void;
}

const AppearanceCard: React.FC<CardProps> = ({ option, isActive, label, resolvedColors: c, isRtl, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const iconScale = useRef(new Animated.Value(isActive ? 1 : 0.85)).current;

  useEffect(() => {
    Animated.spring(glowAnim,  { toValue: isActive ? 1 : 0,    useNativeDriver: false, speed: 18, bounciness: 4 }).start();
    Animated.spring(iconScale, { toValue: isActive ? 1 : 0.85, useNativeDriver: true,  speed: 18, bounciness: 6 }).start();
  }, [isActive]);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const animBorder = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1.5, 2.5] });
  const animShadow = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0,   0.22] });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isActive }}
        style={styles.pressable}
      >
        <Animated.View style={[
          styles.card,
          {
            borderColor:     isActive ? c.interactive.primary : c.border.primary,
            backgroundColor: isActive ? c.interactive.primary + '12' : c.surface.secondary,
            borderWidth:     animBorder,
            shadowColor:     c.interactive.primary,
            shadowOpacity:   animShadow,
            shadowRadius:    14,
            shadowOffset:    { width: 0, height: 5 },
            elevation:       isActive ? 7 : 0,
          },
        ]}>

          {/* Icon bubble */}
          <Animated.View style={[
            styles.iconBubble,
            {
              backgroundColor: isActive ? c.interactive.primary + '20' : c.surface.elevated,
              transform:       [{ scale: iconScale }],
            },
          ]}>
            <Ionicons
              name={option.iconName}
              size={22}
              color={isActive ? c.interactive.primary : c.text.secondary}
            />
          </Animated.View>

          {/* Label */}
          <Text style={[styles.label, {
            color:      isActive ? c.interactive.primary : c.text.secondary,
            fontWeight: isActive ? '700' : '500',
            textAlign:  'center',
          }]} numberOfLines={1}>
            {label}
          </Text>

          {/* Active dot */}
          <View style={[
            styles.activeDot,
            { backgroundColor: isActive ? c.interactive.primary : c.border.primary },
          ]} />

          {/* Check badge */}
          {isActive && (
            <View style={[styles.checkBadge, { backgroundColor: c.interactive.primary }]}>
              <Ionicons name="checkmark" size={9} color={Palette.white} />
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const AppearanceStep: React.FC<Props> = ({ resolvedColors: c, isRtl }) => {
  const { t }     = useTranslation();
  const colorMode = useUiStore((s) => s.colorMode);

  return (
    <View style={styles.row}>
      {COLOR_MODE_OPTIONS.map((option) => (
        <AppearanceCard
          key={option.mode}
          option={option}
          isActive={colorMode === option.mode}
          label={t(option.labelKey)}
          resolvedColors={c}
          isRtl={isRtl}
          onPress={() => useUiStore.getState().setColorMode(option.mode)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row:         { flexDirection: 'row', gap: 10 },
  cardWrapper: { flex: 1 },
  pressable:   { flex: 1 },
  card: {
    flex:              1,
    borderRadius:      18,
    paddingVertical:   10,
    paddingHorizontal: 10,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    minHeight:         60,
    position:          'relative',
  },
  iconBubble: {
    width:          46,
    height:         46,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label:     { fontSize: 12, letterSpacing: 0.2 },
  activeDot: { width: 5, height: 5, borderRadius: 3 },
  checkBadge: {
    position:       'absolute',
    top:            10,
    end:            10,
    width:          18,
    height:         18,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default AppearanceStep;