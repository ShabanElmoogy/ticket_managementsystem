import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/src/constants/theme';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useOnboardingStore } from './store/onboardingStore';
import { changeLanguage, getCurrentLanguage } from '@/src/i18n';
import { useUiStore, type ColorMode, type PaletteOption } from '@/src/stores/uiStore';
import { Palette } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LanguageOption {
  code: 'en' | 'ar';
  nativeLabel: string;
}

interface ColorModeOption {
  mode: ColorMode;
  labelKey: string;
  iconName: 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline';
}

interface PaletteOptionConfig {
  option: PaletteOption;
  labelKey: string;
  primaryColor: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English' },
  { code: 'ar', nativeLabel: 'العربية' },
];

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  { mode: 'light',  labelKey: 'onboarding.appearance.light',  iconName: 'sunny-outline' },
  { mode: 'dark',   labelKey: 'onboarding.appearance.dark',   iconName: 'moon-outline' },
  { mode: 'system', labelKey: 'onboarding.appearance.system', iconName: 'phone-portrait-outline' },
];

const PALETTE_OPTIONS: PaletteOptionConfig[] = [
  { option: 'blue',   labelKey: 'onboarding.palette.blue',   primaryColor: Palette.blue600 },
  { option: 'orange', labelKey: 'onboarding.palette.orange', primaryColor: Palette.orange600 },
  { option: 'green',  labelKey: 'onboarding.palette.green',  primaryColor: Palette.emerald600 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const OnboardingScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const { isRtl } = useDirection();
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  // Read current selections from stores
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>(getCurrentLanguage);
  const colorMode = useUiStore((s) => s.colorMode);
  const paletteOption = useUiStore((s) => s.paletteOption);

  const textAlign = isRtl ? 'right' : 'left';

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLanguageSelect = (code: 'en' | 'ar') => {
    setSelectedLanguage(code);
    changeLanguage(code);
  };

  const handleColorModeSelect = (mode: ColorMode) => {
    useUiStore.getState().setColorMode(mode);
  };

  const handlePaletteSelect = (option: PaletteOption) => {
    useUiStore.getState().setPaletteOption(option);
  };

  const handleGetStarted = async () => {
    await markCompleted();
    router.replace('/(auth)/login');
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Welcome header ──────────────────────────────────────────────── */}
        <View style={styles.welcomeSection}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="ticket-outline"
              size={64}
              color={c.interactive.primary}
            />
          </View>
          <Text
            style={[styles.appName, { color: c.text.primary, textAlign }]}
            accessibilityRole="header"
          >
            TicketFlow Pro
          </Text>
          <Text
            style={[styles.tagline, { color: c.text.secondary, textAlign }]}
          >
            {t('onboarding.welcome.tagline')}
          </Text>
        </View>

        {/* ── Language section ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="language-outline"
              size={20}
              color={c.interactive.primary}
              style={styles.sectionIcon}
            />
            <Text
              style={[styles.sectionTitle, { color: c.text.primary, textAlign }]}
            >
              {t('onboarding.language.title')}
            </Text>
          </View>
          <Text
            style={[styles.sectionSubtitle, { color: c.text.secondary, textAlign }]}
          >
            {t('onboarding.language.subtitle')}
          </Text>

          <View style={styles.optionsRow}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isActive = selectedLanguage === option.code;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => handleLanguageSelect(option.code)}
                  accessibilityRole="button"
                  accessibilityLabel={option.nativeLabel}
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.optionCard,
                    {
                      borderColor: isActive ? c.interactive.primary : c.border.primary,
                      backgroundColor: isActive
                        ? c.interactive.primary + '15'
                        : c.surface.card,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
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

        {/* ── Appearance section ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={c.interactive.primary}
              style={styles.sectionIcon}
            />
            <Text
              style={[styles.sectionTitle, { color: c.text.primary, textAlign }]}
            >
              {t('onboarding.appearance.title')}
            </Text>
          </View>
          <Text
            style={[styles.sectionSubtitle, { color: c.text.secondary, textAlign }]}
          >
            {t('onboarding.appearance.subtitle')}
          </Text>

          <View style={styles.optionsRow}>
            {COLOR_MODE_OPTIONS.map((option) => {
              const isActive = colorMode === option.mode;
              const label = t(option.labelKey);
              return (
                <Pressable
                  key={option.mode}
                  onPress={() => handleColorModeSelect(option.mode)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.optionCard,
                    {
                      borderColor: isActive ? c.interactive.primary : c.border.primary,
                      backgroundColor: isActive
                        ? c.interactive.primary + '15'
                        : c.surface.card,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.iconName}
                    size={24}
                    color={isActive ? c.interactive.primary : c.text.secondary}
                    style={styles.optionIcon}
                  />
                  <Text
                    style={[
                      styles.optionLabelSmall,
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

        {/* ── Palette section ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="brush-outline"
              size={20}
              color={c.interactive.primary}
              style={styles.sectionIcon}
            />
            <Text
              style={[styles.sectionTitle, { color: c.text.primary, textAlign }]}
            >
              {t('onboarding.palette.title')}
            </Text>
          </View>
          <Text
            style={[styles.sectionSubtitle, { color: c.text.secondary, textAlign }]}
          >
            {t('onboarding.palette.subtitle')}
          </Text>

          <View style={styles.optionsRow}>
            {PALETTE_OPTIONS.map((config) => {
              const isActive = paletteOption === config.option;
              const label = t(config.labelKey);
              return (
                <Pressable
                  key={config.option}
                  onPress={() => handlePaletteSelect(config.option)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.optionCard,
                    {
                      borderColor: isActive ? config.primaryColor : c.border.primary,
                      backgroundColor: isActive
                        ? config.primaryColor + '15'
                        : c.surface.card,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.paletteSwatch,
                      { backgroundColor: config.primaryColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.optionLabelSmall,
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
      </ScrollView>

      {/* ── Get Started button ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.buttonContainer,
          { backgroundColor: c.surface.primary, borderTopColor: c.border.primary },
        ]}
      >
        <Pressable
          onPress={handleGetStarted}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.ready.getStarted')}
          style={({ pressed }: { pressed: boolean }) => [
            styles.primaryButton,
            {
              backgroundColor: pressed
                ? c.buttons.primary.pressed
                : c.buttons.primary.bg,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: c.buttons.primary.text },
            ]}
          >
            {t('onboarding.ready.getStarted')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Static styles — no color values here (all colors come from resolvedColors)
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingStart: 24,
    paddingEnd: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionIcon: {
    marginEnd: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.1,
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 18,
    paddingStart: 12,
    paddingEnd: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  optionIcon: {
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  optionLabelSmall: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  paletteSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    paddingStart: 24,
    paddingEnd: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default OnboardingScreen;
