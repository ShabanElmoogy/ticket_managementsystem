import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@/src/constants/tokens';
import { changeLanguage, getCurrentLanguage } from '@/src/i18n';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LanguageOption {
  code: 'en' | 'ar';
  nativeLabel: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English' },
  { code: 'ar', nativeLabel: 'العربية' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface LanguageStepProps {
  /** Resolved theme colors — passed from parent to stay Modal-safe */
  resolvedColors: ThemeColors;
  /** Whether the current layout direction is RTL */
  isRtl: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const LanguageStep: React.FC<LanguageStepProps> = ({ resolvedColors: c, isRtl }) => {
  const { t } = useTranslation();

  // Retain selection on back-navigation by reading the current language (Req 3.7, 3.8)
  const [selectedCode, setSelectedCode] = useState<'en' | 'ar'>(getCurrentLanguage);

  const textAlign = isRtl ? 'right' : 'left';

  const handleSelect = (code: 'en' | 'ar') => {
    setSelectedCode(code);
    // Call changeLanguage immediately — triggers i18n re-render + RTL flip (Req 3.2, 3.3, 3.4)
    changeLanguage(code);
  };

  return (
    <View style={styles.container}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <Text
        style={[styles.title, { color: c.text.primary, textAlign }]}
        accessibilityRole="header"
      >
        {t('onboarding.language.title')}
      </Text>

      {/* ── Subtitle ──────────────────────────────────────────────────────── */}
      <Text
        style={[styles.subtitle, { color: c.text.secondary, textAlign }]}
      >
        {t('onboarding.language.subtitle')}
      </Text>

      {/* ── Language option cards ──────────────────────────────────────────── */}
      <View style={styles.cardsRow}>
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
                  borderColor: isActive
                    ? c.interactive.primary
                    : c.border.primary,
                  backgroundColor: isActive
                    ? c.interactive.primary + '15'
                    : c.surface.card,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {/* Language native label */}
              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: isActive ? c.interactive.primary : c.text.primary,
                    textAlign,
                  },
                ]}
              >
                {option.nativeLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Static styles — no color values here (all colors come from resolvedColors)
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingStart: 24,
    paddingEnd: 24,
    paddingVertical: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0.1,
    marginBottom: 32,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  card: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 24,
    paddingStart: 16,
    paddingEnd: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default LanguageStep;
