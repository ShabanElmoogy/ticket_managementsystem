import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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

const LanguageStep: React.FC<Props> = ({ resolvedColors: c, isRtl }) => {
  const [selectedCode, setSelectedCode] = useState<'en' | 'ar'>(getCurrentLanguage);
  const textAlign = isRtl ? 'right' : 'left';

  const handleSelect = (code: 'en' | 'ar') => {
    setSelectedCode(code);
    changeLanguage(code);
  };

  return (
    <View style={styles.row}>
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = selectedCode === option.code;
        return (
          <Pressable
            key={option.code}
            onPress={() => handleSelect(option.code)}
            accessibilityRole="button"
            accessibilityLabel={option.nativeLabel}
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
            <Text style={styles.flag}>{option.flag}</Text>
            <Text style={[styles.label, { color: isActive ? c.interactive.primary : c.text.primary, textAlign }]}>
              {option.nativeLabel}
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
  card:       { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 16, paddingStart: 14, paddingEnd: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  flag:       { fontSize: 28, marginBottom: 8 },
  label:      { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  checkBadge: { position: 'absolute', top: 8, end: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

export default LanguageStep;
