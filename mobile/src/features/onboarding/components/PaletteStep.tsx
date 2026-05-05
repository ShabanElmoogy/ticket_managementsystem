import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ThemeColors, PaletteOption } from '@/src/constants/tokens';
import { Palette } from '@/src/constants/tokens';
import { useUiStore } from '@/src/stores/uiStore';

interface PaletteOptionConfig {
  option:       PaletteOption;
  labelKey:     string;
  primaryColor: string;
  accentColor:  string;
}

const PALETTE_OPTIONS: PaletteOptionConfig[] = [
  { option: 'blue',   labelKey: 'onboarding.palette.blue',   primaryColor: Palette.blue600,    accentColor: '#93C5FD' },
  { option: 'orange', labelKey: 'onboarding.palette.orange', primaryColor: Palette.orange500,  accentColor: '#FCD34D' },
  { option: 'green',  labelKey: 'onboarding.palette.green',  primaryColor: Palette.emerald600, accentColor: '#6EE7B7' },
];

interface Props {
  resolvedColors: ThemeColors;
  isRtl:          boolean;
}

interface CardProps {
  config:         PaletteOptionConfig;
  isActive:       boolean;
  label:          string;
  resolvedColors: ThemeColors;
  isRtl:          boolean;
  onPress:        () => void;
}

const PaletteCard: React.FC<CardProps> = ({ config, isActive, label, resolvedColors: c, isRtl, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(glowAnim, {
      toValue:         isActive ? 1 : 0,
      useNativeDriver: false,
      speed:           18,
      bounciness:      4,
    }).start();
  }, [isActive]);

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const animatedBorder  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1.5, 2.5] });
  const animatedShadow  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] });

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
        <Animated.View
          style={[
            styles.card,
            {
              borderColor:    isActive ? config.primaryColor : c.border.primary,
              backgroundColor: isActive ? config.primaryColor + '12' : c.surface.secondary,
              borderWidth:    animatedBorder,
              shadowColor:    config.primaryColor,
              shadowOpacity:  animatedShadow,
              shadowRadius:   12,
              shadowOffset:   { width: 0, height: 4 },
              elevation:      isActive ? 6 : 0,
            },
          ]}
        >
          {/* Swatch */}
          <View style={[styles.swatchRing, { borderColor: isActive ? config.primaryColor + '44' : config.primaryColor + '1A' }]}>
            <View style={[styles.swatchCircle, { backgroundColor: config.primaryColor }]}>
              <View style={[styles.swatchShine, { backgroundColor: config.accentColor + '80' }]} />
            </View>
          </View>

          {/* Label */}
          <Text
            style={[
              styles.label,
              {
                color:      isActive ? config.primaryColor : c.text.secondary,
                fontWeight: isActive ? '700' : '500',
                textAlign:  isRtl ? 'right' : 'left',
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>

          {/* Check badge */}
          {isActive && (
            <View style={[styles.checkBadge, { backgroundColor: config.primaryColor }]}>
              <Ionicons name="checkmark" size={9} color={Palette.white} />
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const PaletteStep: React.FC<Props> = ({ resolvedColors: c, isRtl }) => {
  const { t }         = useTranslation();
  const paletteOption = useUiStore((s) => s.paletteOption);

  return (
    <View style={styles.row}>
      {PALETTE_OPTIONS.map((config) => (
        <PaletteCard
          key={config.option}
          config={config}
          isActive={paletteOption === config.option}
          label={t(config.labelKey)}
          resolvedColors={c}
          isRtl={isRtl}
          onPress={() => useUiStore.getState().setPaletteOption(config.option)}
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
    paddingVertical:   12,
    paddingHorizontal: 10,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    minHeight:         90,
    position:          'relative',
  },
  swatchRing: {
    width:          52,
    height:         52,
    borderRadius:   26,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  swatchCircle: {
    width:        42,
    height:       42,
    borderRadius: 21,
    overflow:     'hidden',
    alignItems:   'flex-end',
    justifyContent: 'flex-start',
  },
  swatchShine: {
    width:        16,
    height:       16,
    borderRadius: 8,
    marginTop:    5,
    marginEnd:    5,
  },
  label: {
    fontSize:      12,
    letterSpacing: 0.3,
    textAlign:     'center',
  },
  checkBadge: {
    position:       'absolute',
    top:            9,
    end:            9,
    width:          18,
    height:         18,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default PaletteStep;