import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView } from 'react-native';
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

const OnboardingScreen: React.FC = () => {
  const { t }         = useTranslation();
  const router        = useRouter();
  const c             = useThemeColors();
  const { isRtl }     = useDirection();
  const markCompleted = useOnboardingStore((s) => s.markCompleted);
  const scaleAnim     = useRef(new Animated.Value(1)).current;

  const textAlign        = isRtl ? 'right' : 'left';
  const getStartedArrow  = isRtl ? 'arrow-back-outline' : 'arrow-forward-outline';

  const handleGetStarted = async () => {
    await markCompleted();
    router.replace('/(auth)/login');
  };

  const onPressIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.secondary }]}>

      {/* ── Hero ── */}
      <View style={[styles.hero, { backgroundColor: c.interactive.primary }]}>
        {/* Decorative orbs */}
        <View style={[styles.orb, styles.orbTR]} />
        <View style={[styles.orb, styles.orbBL]} />
        <View style={[styles.orb, styles.orbBR]} />

        {/* Icon badge */}
        <View style={styles.iconBadge}>
          <Ionicons name="ticket-outline" size={34} color={c.interactive.primary} />
        </View>

        <Text style={styles.heroAppName} accessibilityRole="header">
          TicketFlow Pro
        </Text>
        <Text style={styles.heroTagline}>
          {t('onboarding.ready.getStarted')}
        </Text>

        {/* Progress pills — all filled since we show all steps at once */}
        <View style={styles.progressWrap}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressPill,
                i === 1 && styles.progressPillWide,
                { backgroundColor: 'rgba(255,255,255,0.90)' },
              ]}
            />
          ))}
        </View>
      </View>

      {/* ── Scrollable settings card ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>

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
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={[styles.footer, { backgroundColor: c.surface.secondary, borderTopColor: c.border.primary }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
          <Pressable
            onPress={handleGetStarted}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.ready.getStarted')}
            style={[
              styles.getStartedBtn,
              { backgroundColor: c.buttons.primary.bg, flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={[styles.getStartedText, { color: c.text.primary }]} numberOfLines={1}>
              {t('onboarding.ready.getStarted')}
            </Text>
            <View style={[styles.arrowBadge, isRtl ? { marginEnd: 10 } : { marginStart: 10 }]}>
              <Ionicons name={getStartedArrow} size={18} color={c.tint} />
            </View>
          </Pressable>
        </Animated.View>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:   { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 8 },

  /* Hero */
  hero: {
    alignItems:     'center',
    overflow:       'hidden',
    paddingTop:     12,
    paddingBottom:  20,
    paddingHorizontal: 24,
    position:       'relative',
  },
  orb: {
    position:     'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  orbTR: { width: 80, height: 80, top: -20, right: -10 },
  orbBL: { width: 48, height: 48, bottom: 10, left: 18 },
  orbBR: { width: 28, height: 28, bottom: 24, right: 40 },

  iconBadge: {
    width:          64,
    height:         64,
    borderRadius:   18,
    backgroundColor: Palette.white,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   10,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.18,
    shadowRadius:   14,
    elevation:      10,
  },
  heroAppName: {
    fontSize:      20,
    fontWeight:    '800',
    color:         Palette.white,
    letterSpacing: 0.6,
    marginBottom:  3,
    textAlign:     'center',
  },
  heroTagline: {
    fontSize:      12,
    color:         'rgba(255,255,255,0.85)',
    marginBottom:  10,
    textAlign:     'center',
    letterSpacing: 0.2,
  },
  progressWrap: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
  },
  progressPill: {
    width:        20,
    height:       4,
    borderRadius: 999,
  },
  progressPillWide: { width: 32 },

  /* Card */
  card: {
    marginHorizontal: 16,
    marginTop:        -14,
    borderRadius:     22,
    borderWidth:      1,
    padding:          16,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.09,
    shadowRadius:     18,
    elevation:        7,
  },
  divider: {
    height:         StyleSheet.hairlineWidth,
    marginVertical: 20,
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingBottom:     12,
    paddingTop:        10,
    borderTopWidth:    StyleSheet.hairlineWidth,
  },
  getStartedBtn: {
    borderRadius:      16,
    alignItems:        'center',
    justifyContent:    'center',
    paddingVertical:   15,
    paddingHorizontal: 24,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.18,
    shadowRadius:      12,
    elevation:         7,
  },
  getStartedText: {
    fontSize:      15,
    fontWeight:    '700',
    letterSpacing: 0.4,
    flexShrink:    1,
  },
  arrowBadge: {
    width:          28,
    height:         28,
    borderRadius:   14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default OnboardingScreen;