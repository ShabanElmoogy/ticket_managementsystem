import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated } = require('react-native') as { Animated: any };
import { useTranslation } from 'react-i18next';
import { useThemeColors, useIsDark } from '@/src/constants/theme';

export interface LoginBrandHeaderProps {
  isRtl:           boolean;
  onToggleDirection: () => void;
  onToggleTheme:   () => void;
}

const LoginBrandHeader: React.FC<LoginBrandHeaderProps> = ({
  isRtl, onToggleDirection, onToggleTheme,
}) => {
  const c      = useThemeColors();
  const isDark = useIsDark();
  const { t }  = useTranslation();

  const pills = [t('auth.featureDashboard'), t('auth.featureKanban'), t('auth.featureAlerts')];

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 2000, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      {/* Icon + name + controls row */}
      <View style={styles.brandRow}>
        {/* Animated icon */}
        <View style={styles.iconOuter}>
          <Animated.View
            style={[
              styles.glowRing,
              { backgroundColor: c.interactive.primary, transform: [{ scale: pulse }] },
            ]}
          />
          <View style={[styles.iconWrap, { backgroundColor: c.interactive.primary, shadowColor: c.interactive.primary }]}>
            <Text style={styles.iconEmoji}>🎫</Text>
          </View>
        </View>

        {/* App name + tagline */}
        <View style={styles.nameBlock}>
          <Text style={[styles.appName, { color: c.text.primary }]}>{t('auth.appName')}</Text>
          <Text style={[styles.appTagline, { color: c.text.secondary }]}>{t('auth.appTagline')}</Text>
        </View>

        {/* Direction + theme toggles */}
        <View style={styles.controlsRow}>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.controlBtn,
              {
                backgroundColor: pressed ? c.interactive.primary : c.surface.secondary,
                borderColor:     c.border.primary,
              },
            ]}
            onPress={onToggleDirection}
            accessibilityRole="button"
            accessibilityLabel={isRtl ? 'Switch to LTR' : 'Switch to RTL'}
          >
            <Text style={[styles.controlBtnText, { color: c.text.secondary }]}>
              {isRtl ? 'EN' : 'AR'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.controlBtn,
              {
                backgroundColor: pressed ? c.interactive.primary : c.surface.secondary,
                borderColor:     c.border.primary,
              },
            ]}
            onPress={onToggleTheme}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Text style={styles.controlBtnIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Feature pills */}
      <View style={styles.pillRow}>
        {pills.map((f) => (
          <View key={f} style={[styles.pill, { backgroundColor: c.surface.secondary, borderColor: c.interactive.primary }]}>
            <Text style={[styles.pillText, { color: c.interactive.primary }]}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop:        20,
    paddingBottom:     16,
    alignItems:        'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    marginBottom:  12,
    alignSelf:     'stretch',
  },
  iconOuter: {
    width:          52,
    height:         52,
    alignItems:     'center',
    justifyContent: 'center',
  },
  glowRing: {
    position:     'absolute',
    width:        52,
    height:       52,
    borderRadius: 14,
    opacity:      0.2,
  },
  iconWrap: {
    width:          44,
    height:         44,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.4,
    shadowRadius:   10,
    elevation:      8,
  },
  iconEmoji:  { fontSize: 22 },
  nameBlock:  { flex: 1 },
  appName:    { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginBottom: 2 },
  appTagline: { fontSize: 12, lineHeight: 16 },

  controlsRow: { flexDirection: 'row', gap: 6 },
  controlBtn: {
    width:          36,
    height:         36,
    borderRadius:   10,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  controlBtnText: { fontSize: 11, fontWeight: '700' },
  controlBtnIcon: { fontSize: 16 },

  pillRow: {
    flexDirection:  'row',
    gap:            6,
    flexWrap:       'wrap',
    justifyContent: 'center',
  },
  pill: {
    borderRadius:      16,
    paddingHorizontal: 10,
    paddingVertical:   3,
    borderWidth:       1,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
});

export default LoginBrandHeader;
