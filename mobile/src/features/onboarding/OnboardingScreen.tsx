import React, { useState, ComponentProps } from 'react';
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
// Config — defined at module level (no hooks, no render)
// ─────────────────────────────────────────────────────────────────────────────

interface LanguageOption {
  code: 'en' | 'ar';
  nativeLabel: string;
  flag: string;
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
  lightColor: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'ar', nativeLabel: 'العربية', flag: '🇸🇦' },
];

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  { mode: 'light',  labelKey: 'onboarding.appearance.light',  iconName: 'sunny-outline' },
  { mode: 'dark',   labelKey: 'onboarding.appearance.dark',   iconName: 'moon-outline' },
  { mode: 'system', labelKey: 'onboarding.appearance.system', iconName: 'phone-portrait-outline' },
];

const PALETTE_OPTIONS: PaletteOptionConfig[] = [
  { option: 'blue',   labelKey: 'onboarding.palette.blue',   primaryColor: Palette.blue600,    lightColor: Palette.blue100 },
  { option: 'orange', labelKey: 'onboarding.palette.orange', primaryColor: Palette.orange500,  lightColor: Palette.orange100 },
  { option: 'green',  labelKey: 'onboarding.palette.green',  primaryColor: Palette.emerald600, lightColor: Palette.emerald100 },
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

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>(getCurrentLanguage);
  const colorMode    = useUiStore((s) => s.colorMode);
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

  // ── Derived ───────────────────────────────────────────────────────────────

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.secondary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <View
          style={[styles.hero, { backgroundColor: c.interactive.primary }]}
        >
          {/* Icon badge */}
          <View style={styles.iconBadge}>
            <Ionicons name="ticket-outline" size={44} color={c.interactive.primary} />
          </View>

          <Text style={styles.heroAppName} accessibilityRole="header">
            TicketFlow Pro
          </Text>
          <Text style={styles.heroTagline}>
            {t('onboarding.welcome.tagline')}
          </Text>

          {/* Decorative dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === 0 ? Palette.white : 'rgba(255,255,255,0.4)' },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Settings card ────────────────────────────────────────────────── */}
        <View
          style={[
            styles.card,
            { backgroundColor: c.surface.primary, borderColor: c.border.primary },
          ]}
        >

          {/* ── Language ──────────────────────────────────────────────────── */}
          <SectionLabel
            icon="language-outline"
            title={t('onboarding.language.title')}
            subtitle={t('onboarding.language.subtitle')}
            accentColor={c.interactive.primary}
            textColor={c.text.primary}
            subtitleColor={c.text.secondary}
            textAlign={textAlign}
          />

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
                    styles.langCard,
                    {
                      borderColor: isActive ? c.interactive.primary : c.border.primary,
                      backgroundColor: isActive
                        ? c.interactive.primary + '12'
                        : c.surface.secondary,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <Text style={styles.langFlag}>{option.flag}</Text>
                  <Text
                    style={[
                      styles.langLabel,
                      { color: isActive ? c.interactive.primary : c.text.primary },
                    ]}
                  >
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

          <View style={[styles.divider, { backgroundColor: c.border.primary }]} />

          {/* ── Appearance ────────────────────────────────────────────────── */}
          <SectionLabel
            icon="contrast-outline"
            title={t('onboarding.appearance.title')}
            subtitle={t('onboarding.appearance.subtitle')}
            accentColor={c.interactive.primary}
            textColor={c.text.primary}
            subtitleColor={c.text.secondary}
            textAlign={textAlign}
          />

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
                    styles.modeCard,
                    {
                      borderColor: isActive ? c.interactive.primary : c.border.primary,
                      backgroundColor: isActive
                        ? c.interactive.primary + '12'
                        : c.surface.secondary,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.modeIconWrap,
                      {
                        backgroundColor: isActive
                          ? c.interactive.primary + '20'
                          : c.surface.elevated,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.iconName}
                      size={22}
                      color={isActive ? c.interactive.primary : c.text.secondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.modeLabel,
                      { color: isActive ? c.interactive.primary : c.text.secondary },
                    ]}
                  >
                    {label}
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

          <View style={[styles.divider, { backgroundColor: c.border.primary }]} />

          {/* ── Palette ───────────────────────────────────────────────────── */}
          <SectionLabel
            icon="color-fill-outline"
            title={t('onboarding.palette.title')}
            subtitle={t('onboarding.palette.subtitle')}
            accentColor={c.interactive.primary}
            textColor={c.text.primary}
            subtitleColor={c.text.secondary}
            textAlign={textAlign}
          />

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
                    styles.paletteCard,
                    {
                      borderColor: isActive ? config.primaryColor : c.border.primary,
                      backgroundColor: isActive
                        ? config.primaryColor + '12'
                        : c.surface.secondary,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  {/* Color swatch */}
                  <View
                    style={[styles.paletteSwatch, { backgroundColor: config.primaryColor }]}
                  />
                  <Text
                    style={[
                      styles.paletteLabel,
                      { color: isActive ? config.primaryColor : c.text.secondary },
                    ]}
                  >
                    {label}
                  </Text>
                  {isActive && (
                    <View style={[styles.checkBadge, { backgroundColor: config.primaryColor }]}>
                      <Ionicons name="checkmark" size={10} color={Palette.white} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

        </View>
      </ScrollView>

      {/* ── Get Started button ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.footer,
          { backgroundColor: c.surface.secondary, borderTopColor: c.border.primary },
        ]}
      >
        <Pressable
          onPress={handleGetStarted}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.ready.getStarted')}
          style={({ pressed }: { pressed: boolean }) => [
            styles.getStartedBtn,
            { backgroundColor: pressed ? c.buttons.primary.pressed : c.buttons.primary.bg },
          ]}
        >
          <Text style={styles.getStartedText}>
            {t('onboarding.ready.getStarted')}
          </Text>
          <Ionicons
            name="arrow-forward-outline"
            size={20}
            color={Palette.white}
            style={styles.getStartedArrow}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SectionLabel — small reusable header for each settings group
// ─────────────────────────────────────────────────────────────────────────────

type IoniconName = string; // eslint-disable-line @typescript-eslint/no-unused-vars

interface SectionLabelProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  accentColor: string;
  textColor: string;
  subtitleColor: string;
  textAlign: 'left' | 'right';
}

const SectionLabel: React.FC<SectionLabelProps> = ({
  icon, title, subtitle, accentColor, textColor, subtitleColor, textAlign,
}) => (
  <View style={labelStyles.container}>
    <View style={labelStyles.row}>
      <View style={[labelStyles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Ionicons name={icon} size={16} color={accentColor} />
      </View>
      <Text style={[labelStyles.title, { color: textColor, textAlign }]}>{title}</Text>
    </View>
    <Text style={[labelStyles.subtitle, { color: subtitleColor, textAlign }]}>{subtitle}</Text>
  </View>
);

const labelStyles = StyleSheet.create({
  container: { marginBottom: 14 },
  row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  iconWrap:  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginEnd: 10 },
  title:     { fontSize: 16, fontWeight: '700', letterSpacing: 0.2, flex: 1 },
  subtitle:  { fontSize: 13, fontWeight: '400', lineHeight: 18, letterSpacing: 0.1, paddingStart: 38 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingStart: 24,
    paddingEnd: 24,
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroAppName: {
    fontSize: 30,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroTagline: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    marginStart: 16,
    marginEnd: 16,
    marginTop: -20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
  },

  // ── Language cards ────────────────────────────────────────────────────────
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 16,
    paddingStart: 14,
    paddingEnd: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  langFlag: {
    fontSize: 28,
    marginBottom: 8,
  },
  langLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Color mode cards ──────────────────────────────────────────────────────
  modeCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 16,
    paddingStart: 10,
    paddingEnd: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Palette cards ─────────────────────────────────────────────────────────
  paletteCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 16,
    paddingStart: 10,
    paddingEnd: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  paletteSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  paletteLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Check badge (active indicator) ────────────────────────────────────────
  checkBadge: {
    position: 'absolute',
    top: 8,
    end: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingStart: 16,
    paddingEnd: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  getStartedBtn: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingStart: 24,
    paddingEnd: 24,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: 0.3,
  },
  getStartedArrow: {
    marginStart: 8,
  },
});

export default OnboardingScreen;
