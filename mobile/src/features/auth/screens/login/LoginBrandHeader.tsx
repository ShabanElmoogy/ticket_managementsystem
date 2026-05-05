import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated } = require('react-native') as { Animated: any };
import { useTranslation } from 'react-i18next';
import { useThemeColors, useIsDark, Palette } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export interface LoginBrandHeaderProps {
  isRtl: boolean;
  onToggleDirection: () => void;
  onToggleTheme: () => void;
}

const LoginBrandHeader: React.FC<LoginBrandHeaderProps> = ({
  isRtl, onToggleDirection, onToggleTheme,
}) => {
  const c = useThemeColors();
  const isDark = useIsDark();
  const { t } = useTranslation();

  const pills = [t('auth.featureDashboard'), t('auth.featureKanban'), t('auth.featureAlerts')];

  // ── Animation refs ──────────────────────────────────────────────────────────
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1.18)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();

    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1.38, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ]),
    );
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse2, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 1.38, duration: 2000, useNativeDriver: true }),
      ]),
    );
    anim1.start();
    anim2.start();
    return () => { anim1.stop(); anim2.stop(); };
  }, [pulse1, pulse2, fadeIn, slideUp]);

  // Split "TicketFlow Pro" → base + accent " Pro"
  const appName = t('auth.appName');
  const PRO_PART = ' Pro';
  const baseName = appName.endsWith(PRO_PART) ? appName.slice(0, -PRO_PART.length) : appName;
  const hasPro = appName.endsWith(PRO_PART);

  // Control button helpers — keep natural direction so RTL order is fine
  // Target language shown (so user sees what they'd switch TO)
  const langLabel = isRtl ? 'EN' : 'AR';
  const themeIconName = isDark ? 'sunny-outline' : 'moon-outline';
  const themeLabel = isDark ? t('onboarding.appearance.light') : t('onboarding.appearance.dark');

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
      ]}
    >
      {/* ── Brand row ─────────────────────────────────────────────────────── */}
      <View style={styles.brandRow}>

        {/* Animated icon — dual concentric glow */}
        <View style={styles.iconOuter}>
          <Animated.View style={[
            styles.glowRingOuter,
            { backgroundColor: c.interactive.primary, transform: [{ scale: pulse2 }] },
          ]} />
          <Animated.View style={[
            styles.glowRingInner,
            { backgroundColor: c.interactive.primary, transform: [{ scale: pulse1 }] },
          ]} />
          <View style={[
            styles.iconWrap,
            { backgroundColor: c.interactive.primary, shadowColor: c.interactive.primary },
          ]}>
            <Ionicons name="ticket-outline" size={22} color={Palette.white} />
          </View>
        </View>

        {/* App name */}
        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={[styles.appNameBase, { color: c.text.primary }]}>{baseName}</Text>
            {hasPro && (
              <Text style={[styles.appNameAccent, { color: c.interactive.primary }]}>
                {PRO_PART}
              </Text>
            )}
          </View>
        </View>

        {/* ── Control pills ──────────────────────────────────────────────── */}
        {/*
          Wrap in a View with explicit LTR direction so the two pill order
          (lang | theme) stays consistent regardless of the app's RTL state.
          The individual pill labels still respond to the app language.
        */}
        <View style={[styles.controlsRow, { direction: 'ltr' } as any]}>

          {/* Language / direction pill */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.ctrlPill,
              {
                backgroundColor: pressed
                  ? c.interactive.primary
                  : isDark ? c.surface.elevated : c.surface.tertiary,
                borderColor: pressed
                  ? c.interactive.primary
                  : `${c.interactive.primary}50`,
                shadowColor: c.interactive.primary,
              },
            ]}
            onPress={onToggleDirection}
            accessibilityRole="button"
            accessibilityLabel={isRtl ? t('auth.switchToLtr') : t('auth.switchToRtl')}
          >
            {({ pressed }: { pressed: boolean }) => (
              <>
                <Ionicons name="language-outline" size={22} color={pressed ? Palette.white : c.interactive.primary} />
                <Text style={[
                  styles.ctrlPillText,
                  { color: pressed ? Palette.white : c.text.primary, marginLeft: 5 },
                ]}>
                  {langLabel}
                </Text>
              </>
            )}
          </Pressable>

          {/* Theme toggle pill */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.ctrlPill,
              {
                backgroundColor: pressed
                  ? c.interactive.primary
                  : isDark ? c.surface.elevated : c.surface.tertiary,
                borderColor: pressed
                  ? c.interactive.primary
                  : `${c.interactive.primary}50`,
                shadowColor: c.interactive.primary,
              },
            ]}
            onPress={onToggleTheme}
            accessibilityRole="button"
            accessibilityLabel={isDark ? t('auth.switchToLight') : t('auth.switchToDark')}
          >
            {({ pressed }: { pressed: boolean }) => (
              <>
                <Ionicons name={themeIconName} size={22} color={pressed ? Palette.white : c.interactive.primary} />
                <Text style={[
                  styles.ctrlPillText,
                  { color: pressed ? Palette.white : c.text.primary },
                ]}>
                  {themeLabel}
                </Text>
              </>
            )}
          </Pressable>

        </View>
      </View>

      {/* ── Feature pills ──────────────────────────────────────────────────── */}
      {/* <View style={styles.pillRow}>
        {pills.map((f) => (
          <View
            key={f}
            style={[
              styles.pill,
              {
                backgroundColor: isDark
                  ? `${c.interactive.primary}1C`
                  : `${c.interactive.primary}12`,
                borderColor: `${c.interactive.primary}55`,
              },
            ]}
          >
            <Text style={[styles.pillText, { color: c.interactive.primary }]}>{f}</Text>
          </View>
        ))}
      </View> */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
  },

  // ── Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 5,
    alignSelf: 'stretch',
  },

  // ── Icon
  iconOuter: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingOuter: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 17,
    opacity: 0.1,
  },
  glowRingInner: {
    position: 'absolute',
    width: 53,
    height: 53,
    borderRadius: 15,
    opacity: 0.2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 10,
  },


  // ── Name block
  nameBlock: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  appNameBase: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  appNameAccent: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  // ── Control pills
  controlsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  ctrlPill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 1
  },
  ctrlPillIcon: { fontSize: 22 },
  ctrlPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    mar: 'center'
  },

  // ── Feature pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    marginTop : 4
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2
  },
});

export default LoginBrandHeader;
