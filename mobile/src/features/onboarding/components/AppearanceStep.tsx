import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@/src/constants/tokens';
import { useUiStore, type ColorMode } from '@/src/stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ColorModeOption {
  mode: ColorMode;
  labelKey: string;
  iconName: 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline';
}

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  { mode: 'light',  labelKey: 'onboarding.appearance.light',  iconName: 'sunny-outline' },
  { mode: 'dark',   labelKey: 'onboarding.appearance.dark',   iconName: 'moon-outline' },
  { mode: 'system', labelKey: 'onboarding.appearance.system', iconName: 'phone-portrait-outline' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface AppearanceStepProps {
  /** Resolved theme colors — passed from parent to stay Modal-safe */
  resolvedColors: ThemeColors;
  /** Whether the current layout direction is RTL */
  isRtl: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const AppearanceStep: React.FC<AppearanceStepProps> = ({ resolvedColors: c, isRtl }) => {
  const { t } = useTranslation();

  // Retain selection on back-navigation by reading from uiStore (Req 4.5, 4.6)
  const colorMode = useUiStore((s) => s.colorMode);

  const textAlign = isRtl ? 'right' : 'left';

  const handleSelect = (mode: ColorMode) => {
    // Call setColorMode immediately — triggers live preview re-render (Req 4.2)
    useUiStore.getState().setColorMode(mode);
  };

  return (
    <View style={styles.container}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <Text
        style={[styles.title, { color: c.text.primary, textAlign }]}
        accessibilityRole="header"
      >
        {t('onboarding.appearance.title')}
      </Text>

      {/* ── Subtitle ──────────────────────────────────────────────────────── */}
      <Text
        style={[styles.subtitle, { color: c.text.secondary, textAlign }]}
      >
        {t('onboarding.appearance.subtitle')}
      </Text>

      {/* ── Color mode option cards ────────────────────────────────────────── */}
      <View style={styles.cardsRow}>
        {COLOR_MODE_OPTIONS.map((option) => {
          const isActive = colorMode === option.mode;
          const label = t(option.labelKey);

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
              {/* Icon */}
              <Ionicons
                name={option.iconName}
                size={28}
                color={isActive ? c.interactive.primary : c.text.secondary}
                style={styles.icon}
              />

              {/* Label */}
              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: isActive ? c.interactive.primary : c.text.primary,
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
  icon: {
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default AppearanceStep;
