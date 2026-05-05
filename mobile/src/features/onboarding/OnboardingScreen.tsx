import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/src/constants/theme';
import { useDirection } from '@/src/providers/DirectionProvider';
import { Palette } from '@/src/constants/tokens';
import { useOnboardingStore } from './store/onboardingStore';

import SectionLabel    from './components/SectionLabel';
import LanguageStep    from './components/LanguageStep';
import AppearanceStep  from './components/AppearanceStep';
import PaletteStep     from './components/PaletteStep';

const OnboardingScreen: React.FC = () => {
  const { t }          = useTranslation();
  const router         = useRouter();
  const c              = useThemeColors();
  const { isRtl }      = useDirection();
  const markCompleted  = useOnboardingStore((s) => s.markCompleted);

  const textAlign = isRtl ? 'right' : 'left';

  const handleGetStarted = async () => {
    await markCompleted();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.surface.secondary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero header ── */}
        <View style={[styles.hero, { backgroundColor: c.interactive.primary }]}>
          <View style={styles.iconBadge}>
            <Ionicons name="ticket-outline" size={44} color={c.interactive.primary} />
          </View>
          <Text style={styles.heroAppName} accessibilityRole="header">
            TicketFlow Pro
          </Text>
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
      </ScrollView>

      {/* ── Get Started button ── */}
      <View style={[styles.footer, { backgroundColor: c.surface.secondary, borderTopColor: c.border.primary }]}>
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
          <Ionicons name="arrow-forward-outline" size={20} color={Palette.white} style={styles.arrow} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:      { flex: 1 },
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  hero: {
    alignItems:    'center',
    paddingTop:    10,
    paddingBottom: 10,
    paddingStart:  24,
    paddingEnd:    24,
  },
  iconBadge: {
    width:           88,
    height:          88,
    borderRadius:    24,
    backgroundColor: Palette.white,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    10,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.15,
    shadowRadius:    12,
    elevation:       8,
  },
  heroAppName: {
    fontSize:     22,
    fontWeight:   '800',
    color:        Palette.white,
    letterSpacing: 0.5,
    marginBottom: 18,
    textAlign:    'center',
  },

  card: {
    marginStart:   16,
    marginEnd:     16,
    marginTop:     -20,
    borderRadius:  20,
    borderWidth:   1,
    padding:       20,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  12,
    elevation:     4,
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    marginVertical:  20,
  },

  footer: {
    paddingStart:  16,
    paddingEnd:    16,
    paddingBottom: 16,
    paddingTop:    12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  getStartedBtn: {
    borderRadius:    16,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 17,
    paddingStart:    24,
    paddingEnd:      24,
  },
  getStartedText: {
    fontSize:      16,
    fontWeight:    '700',
    color:         Palette.white,
    letterSpacing: 0.3,
  },
  arrow: { marginStart: 8 },
});

export default OnboardingScreen;
