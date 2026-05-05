import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/src/constants/tokens';
import { Palette } from '@/src/constants/tokens';
import { changeLanguage, getCurrentLanguage } from '@/src/i18n';

interface LanguageOption {
  code:        'en' | 'ar';
  nativeLabel: string;
  subLabel:    string;
  flag:        string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English',  subLabel: 'United States',              flag: '🇺🇸' },
  { code: 'ar', nativeLabel: 'العربية', subLabel: 'المملكة العربية السعودية',  flag: '🇸🇦' },
];

interface Props {
  resolvedColors: ThemeColors;
  isRtl:          boolean;
}

interface CardProps {
  option:         LanguageOption;
  isActive:       boolean;
  resolvedColors: ThemeColors;
  isRtl:          boolean;
  onPress:        () => void;
}

const LanguageCard: React.FC<CardProps> = ({ option, isActive, resolvedColors: c, isRtl, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const flagScale = useRef(new Animated.Value(isActive ? 1 : 0.82)).current;

  useEffect(() => {
    Animated.spring(glowAnim,  { toValue: isActive ? 1 : 0,    useNativeDriver: false, speed: 18, bounciness: 4 }).start();
    Animated.spring(flagScale, { toValue: isActive ? 1 : 0.82, useNativeDriver: true,  speed: 18, bounciness: 6 }).start();
  }, [isActive]);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const animBorder  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1.5, 2.5] });
  const animShadow  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0,   0.22] });
  const animBubble  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0,   0.12] });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={option.nativeLabel}
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
          {/* Flag bubble */}
          <Animated.View style={[
            styles.flagBubble,
            {
              backgroundColor: isActive
                ? c.interactive.primary + '18'
                : c.border.primary + '55',
              transform: [{ scale: flagScale }],
            },
          ]}>
            <Text style={styles.flag}>{option.flag}</Text>
          </Animated.View>

          {/* Labels */}
          <Text style={[styles.nativeLabel, {
            color:      isActive ? c.interactive.primary : c.text.primary,
            fontWeight: isActive ? '700' : '600',
            textAlign:  isRtl ? 'right' : 'center',
          }]} numberOfLines={1}>
            {option.nativeLabel}
          </Text>
          <Text style={[styles.subLabel, {
            color: isActive ? c.interactive.primary + 'AA' : c.text.secondary,
          }]} numberOfLines={1}>
            {option.subLabel}
          </Text>

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

const LanguageStep: React.FC<Props> = ({ resolvedColors: c, isRtl }) => {
  const [selectedCode, setSelectedCode] = useState<'en' | 'ar'>(getCurrentLanguage);

  const handleSelect = (code: 'en' | 'ar') => {
    setSelectedCode(code);
    changeLanguage(code);
  };

  return (
    <View style={styles.row}>
      {LANGUAGE_OPTIONS.map((option) => (
        <LanguageCard
          key={option.code}
          option={option}
          isActive={selectedCode === option.code}
          resolvedColors={c}
          isRtl={isRtl}
          onPress={() => handleSelect(option.code)}
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
    borderRadius:      20,
    paddingVertical:   10,
    paddingHorizontal: 12,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               6,
    minHeight:         90,
    position:          'relative',
  },
  flagBubble: {
    width:          54,
    height:         54,
    borderRadius:   27,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   2,
  },
  flag:        { fontSize: 28 },
  nativeLabel: { fontSize: 14, letterSpacing: 0.2, textAlign: 'center' },
  subLabel:    { fontSize: 10, fontWeight: '400', letterSpacing: 0.1, textAlign: 'center' },
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

export default LanguageStep;