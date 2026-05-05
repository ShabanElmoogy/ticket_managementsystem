import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@/src/constants/tokens';
import { useUiStore } from '@/src/stores/uiStore';
import { getCurrentLanguage } from '@/src/i18n';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ReadyStepProps {
  /** Resolved theme colors — passed from parent to stay Modal-safe */
  resolvedColors: ThemeColors;
  /** Whether the current layout direction is RTL */
  isRtl: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ReadyStep: React.FC<ReadyStepProps> = ({ resolvedColors: c, isRtl }) => {
  const { t } = useTranslation();

  // Read selected preferences from uiStore (Req 7.3)
  const colorMode    = useUiStore((s) => s.colorMode);
  const paletteOption = useUiStore((s) => s.paletteOption);

  const textAlign = isRtl ? 'right' : 'left';

  // ── Derived display values ─────────────────────────────────────────────────

  // Language name in its own native script (Req 3.5)
  const currentLang = getCurrentLanguage();
  const languageName = currentLang === 'ar' ? 'العربية' : 'English';

  // Translated color mode label
  const colorModeLabel = t(`onboarding.appearance.${colorMode}`);

  // Translated palette label
  const paletteLabel = t(`onboarding.palette.${paletteOption}`);

  return (
    <View style={styles.container}>
      {/* ── App name (Req 7.5) ────────────────────────────────────────────── */}
      <Text
        style={[styles.appName, { color: c.interactive.primary, textAlign }]}
        accessibilityRole="header"
      >
        {t('auth.appName')}
      </Text>

      {/* ── Confirmation title (Req 7.5) ──────────────────────────────────── */}
      <Text
        style={[styles.title, { color: c.text.primary, textAlign }]}
      >
        {t('onboarding.ready.title')}
      </Text>

      {/* ── Subtitle ──────────────────────────────────────────────────────── */}
      <Text
        style={[styles.subtitle, { color: c.text.secondary, textAlign }]}
      >
        {t('onboarding.ready.subtitle')}
      </Text>

      {/* ── Preferences summary (Req 7.3) ─────────────────────────────────── */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: c.surface.card,
            borderColor: c.border.primary,
          },
        ]}
      >
        {/* Language row */}
        <View style={styles.summaryRow}>
          <Text
            style={[styles.summaryLabel, { color: c.text.secondary, textAlign }]}
          >
            {t('onboarding.ready.language')}
          </Text>
          <Text
            style={[styles.summaryValue, { color: c.text.primary, textAlign }]}
          >
            {languageName}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: c.border.primary }]} />

        {/* Color mode row */}
        <View style={styles.summaryRow}>
          <Text
            style={[styles.summaryLabel, { color: c.text.secondary, textAlign }]}
          >
            {t('onboarding.ready.colorMode')}
          </Text>
          <Text
            style={[styles.summaryValue, { color: c.text.primary, textAlign }]}
          >
            {colorModeLabel}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: c.border.primary }]} />

        {/* Palette row */}
        <View style={styles.summaryRow}>
          <Text
            style={[styles.summaryLabel, { color: c.text.secondary, textAlign }]}
          >
            {t('onboarding.ready.palette')}
          </Text>
          <Text
            style={[styles.summaryValue, { color: c.interactive.primary, textAlign }]}
          >
            {paletteLabel}
          </Text>
        </View>
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
  appName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
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
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingStart: 16,
    paddingEnd: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginStart: 16,
    marginEnd: 16,
  },
});

export default ReadyStep;
