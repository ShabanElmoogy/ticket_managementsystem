import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors, PaletteOption } from '@/src/constants/tokens';
import { Palette } from '@/src/constants/tokens';
import { useUiStore } from '@/src/stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Palette option config — defined at module level using Palette.* constants
// (Req 5.1, 5.3 — never inside render)
// ─────────────────────────────────────────────────────────────────────────────

interface PaletteOptionConfig {
  option: PaletteOption;
  labelKey: string;
  primaryColor: string;
  darkColor: string;
}

const PALETTE_OPTIONS: PaletteOptionConfig[] = [
  {
    option:       'blue',
    labelKey:     'onboarding.palette.blue',
    primaryColor: Palette.blue600,
    darkColor:    Palette.blue700,
  },
  {
    option:       'orange',
    labelKey:     'onboarding.palette.orange',
    primaryColor: Palette.orange600,
    darkColor:    Palette.orange700,
  },
  {
    option:       'green',
    labelKey:     'onboarding.palette.green',
    primaryColor: Palette.emerald600,
    darkColor:    Palette.emerald700,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface PaletteStepProps {
  /** Resolved theme colors — passed from parent to stay Modal-safe */
  resolvedColors: ThemeColors;
  /** Whether the current layout direction is RTL */
  isRtl: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const PaletteStep: React.FC<PaletteStepProps> = ({ resolvedColors: c, isRtl }) => {
  const { t } = useTranslation();

  // Retain selection on back-navigation by reading from uiStore (Req 5.5, 5.6)
  const paletteOption = useUiStore((s) => s.paletteOption);

  const textAlign = isRtl ? 'right' : 'left';

  const handleSelect = (option: PaletteOption) => {
    // Call setPaletteOption immediately — triggers live preview re-render (Req 5.2)
    useUiStore.getState().setPaletteOption(option);
  };

  return (
    <View style={styles.container}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <Text
        style={[styles.title, { color: c.text.primary, textAlign }]}
        accessibilityRole="header"
      >
        {t('onboarding.palette.title')}
      </Text>

      {/* ── Subtitle ──────────────────────────────────────────────────────── */}
      <Text
        style={[styles.subtitle, { color: c.text.secondary, textAlign }]}
      >
        {t('onboarding.palette.subtitle')}
      </Text>

      {/* ── Palette option cards ───────────────────────────────────────────── */}
      <View style={styles.cardsRow}>
        {PALETTE_OPTIONS.map((config) => {
          const isActive = paletteOption === config.option;
          const label = t(config.labelKey);

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
                  // Active: use the palette's own primary color (Req 5.4)
                  borderColor: isActive
                    ? config.primaryColor
                    : c.border.primary,
                  backgroundColor: isActive
                    ? config.primaryColor + '15'
                    : c.surface.card,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {/* Color swatch circle (Req 5.3) */}
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: config.primaryColor },
                ]}
              />

              {/* Label (Req 5.7 — translated via t()) */}
              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: isActive ? config.primaryColor : c.text.primary,
                    textAlign,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Static styles — no color values here (all colors come from resolvedColors
// or Palette.* constants defined at module level)
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
    gap: 12,
  },
  card: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 24,
    paddingStart: 12,
    paddingEnd: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default PaletteStep;
