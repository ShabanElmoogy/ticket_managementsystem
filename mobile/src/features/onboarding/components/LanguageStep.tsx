import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated } = require('react-native') as { Animated: any };
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/src/constants/tokens';
import { Palette } from '@/src/constants/tokens';
import { changeLanguage, getCurrentLanguage } from '@/src/i18n';

interface LanguageOption {
  code:        'en' | 'ar';
  nativeLabel: string;
  flag:        string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English',  flag: '🇺🇸' },
  { code: 'ar', nativeLabel: 'العربية', flag: '🇸🇦' },
];

interface Props {
  resolvedColors: ThemeColors;
  isRtl:          boolean;
}

interface PillProps {
  option:         LanguageOption;
  isActive:       boolean;
  resolvedColors: ThemeColors;
  onPress:        () => void;
}

const LanguagePill: React.FC<PillProps> = ({ option, isActive, resolvedColors: c, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fillAnim  = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue:         isActive ? 1 : 0,
      useNativeDriver: false,
      speed:           20,
      bounciness:      4,
    }).start();
  }, [isActive]);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  const bgColor     = isActive ? c.interactive.primary : 'transparent';
  const borderColor = isActive ? c.interactive.primary : c.border.primary;
  const textColor   = isActive ? c.buttons.primary.text : c.text.secondary;
  const flagOpacity = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={option.nativeLabel}
        accessibilityState={{ selected: isActive }}
        style={[
          styles.pill,
          {
            backgroundColor: bgColor,
            borderColor,
            shadowColor:     c.interactive.primary,
            shadowOpacity:   isActive ? 0.20 : 0,
            shadowRadius:    8,
            shadowOffset:    { width: 0, height: 3 },
            elevation:       isActive ? 4 : 0,
          },
        ]}
      >
        {/* Flag */}
        <Animated.Text style={[styles.flag, { opacity: flagOpacity }]}>
          {option.flag}
        </Animated.Text>

        {/* Label */}
        <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
          {option.nativeLabel}
        </Text>

        {/* Checkmark — only when active */}
        {isActive && (
          <View style={styles.check}>
            <Ionicons name="checkmark-circle" size={16} color={c.buttons.primary.text} />
          </View>
        )}
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
    <View style={[styles.row, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
      {LANGUAGE_OPTIONS.map((option) => (
        <View key={option.code} style={{ flex: 1 }}>
          <LanguagePill
            option={option}
            isActive={selectedCode === option.code}
            resolvedColors={c}
            onPress={() => handleSelect(option.code)}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: 10,
  },
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    paddingVertical:   11,
    paddingHorizontal: 16,
    borderRadius:      99,
    borderWidth:       1.5,
  },
  flag:  { fontSize: 20 },
  label: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2, flexShrink: 1 },
  check: { marginStart: 2 },
});

export default LanguageStep;
