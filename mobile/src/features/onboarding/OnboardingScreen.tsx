import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/src/constants/theme';
import { useDirection } from '@/src/providers/DirectionProvider';
import { Palette } from '@/src/constants/tokens';
import { useOnboardingStore } from './store/onboardingStore';

import SectionLabel from './components/SectionLabel';
import LanguageStep from './components/LanguageStep';
import AppearanceStep from './components/AppearanceStep';
import PaletteStep from './components/PaletteStep';

const TOTAL_STEPS = 3;

const OnboardingScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useThemeColors();
  const { isRtl } = useDirection();
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  const textAlign = isRtl ? 'right' : 'left';
  const getStartedArrow = isRtl ? 'arrow-back-outline' : 'arrow-forward-outline';

  const handleGetStarted = async () => {
    await markCompleted();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.secondary }]}>
      <View style={styles.content}>
        {/* ── Hero header ── */}
        <View style={[styles.hero, { backgroundColor: c.interactive.primary }]}>
          <View style={[styles.heroGlow, { backgroundColor: c.interactive.primary }]} />
          <View style={styles.heroOrbTop} />
          <View style={styles.heroOrbBottom} />
          <View style={styles.iconBadge}>
            <Ionicons name="ticket-outline" size={36} color={c.interactive.primary} />
          </View>
          <Text style={styles.heroAppName} accessibilityRole="header">
            TicketFlow Pro
          </Text>
          <Text style={styles.heroTagline}>
            {t('onboarding.ready.getStarted')}
          </Text>
          <View style={styles.progressWrap}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressPill,
                  {
                    backgroundColor:
                      step <= TOTAL_STEPS ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Settings card ── */}
        <View style={[styles.card, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>

          {/* Language section */}
          <SectionLabel
            icon="language-outline"
            title={t('onboarding.language.title')}
            subtitle={t('onboarding.language.subtitle')}
            accentColor={c.interactive.primary}
            textColor={c.text.primary}
            subtitleColor={c.text.secondary}
            textAlign={textAlign}
          />
          <LanguageStep resolvedColors={c} isRtl={isRtl} />

          <View style={[styles.divider, { backgroundColor: c.border.primary }]} />

          {/* Appearance section */}
          <SectionLabel
            icon="contrast-outline"
            title={t('onboarding.appearance.title')}
            subtitle={t('onboarding.appearance.subtitle')}
            accentColor={c.interactive.primary}
            textColor={c.text.primary}
            subtitleColor={c.text.secondary}
            textAlign={textAlign}
          />
          <AppearanceStep resolvedColors={c} isRtl={isRtl} />

          <View style={[styles.divider, { backgroundColor: c.border.primary }]} />

          {/* Palette section */}
          <SectionLabel
            icon="color-fill-outline"
            title={t('onboarding.palette.title')}
            subtitle={t('onboarding.palette.subtitle')}
            accentColor={c.interactive.primary}
            textColor={c.text.primary}
            subtitleColor={c.text.secondary}
            textAlign={textAlign}
          />
          <PaletteStep resolvedColors={c} isRtl={isRtl} />

        </View>
      </View>

      {/* ── Get Started button ── */}
      <View
        style={[
          styles.footer,
          { backgroundColor: c.surface.secondary, borderTopColor: c.border.primary },
          { alignItems: isRtl ? 'flex-start' : 'flex-end' },
        ]}
      >
        <Pressable
          onPress={handleGetStarted}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.ready.getStarted')}
          style={({ pressed }: { pressed: boolean }) => [
            styles.getStartedBtn,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
            { backgroundColor: pressed ? c.buttons.primary.pressed : c.buttons.primary.bg },
            pressed && styles.getStartedBtnPressed,
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Text
              style={[styles.getStartedText, { flexShrink: 1 },{color : c.text.primary}]} // مهم عشان النص ما يكسرش الصف
              numberOfLines={1}
            >
              {t('onboarding.ready.getStarted')}
            </Text>

            <View
              style={[
                styles.arrowBadge,
                isRtl ? styles.arrowBadgeRtl : styles.arrowBadgeLtr,
             
              ]}
            >
              <Ionicons
                name={getStartedArrow}
                size={18}
                color={c.tint}
              />
            </View>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, paddingBottom: 8 },

  hero: {
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: 16,
    paddingStart: 24,
    paddingEnd: 24,
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -120,
    opacity: 0.18,
    transform: [{ translateX: 120 }],
  },
  heroOrbTop: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: 12,
    right: 24,
  },
  heroOrbBottom: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    bottom: 16,
    left: 26,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroAppName: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  progressPill: {
    width: 24,
    height: 5,
    borderRadius: 999,
    marginHorizontal: 4,
  },

  card: {
    flex: 1,
    marginStart: 16,
    marginEnd: 16,
    marginTop: -10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 22,
  },

  footer: {
    paddingStart: 16,
    paddingEnd: 16,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  getStartedBtn: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 220,
    paddingVertical: 14,
    paddingStart: 24,
    paddingEnd: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
  getStartedBtnPressed: {
    transform: [{ scale: 0.99 }],
  },
  getStartedText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  arrowBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBadgeLtr: { marginStart: 10 },
  arrowBadgeRtl: { marginEnd: 10 },
  footerHint: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHintText: {
    marginStart: 6,
    fontSize: 11,
    fontWeight: '500',
  },
});

export default OnboardingScreen;
