import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface WelcomeStepProps {
  /** Resolved theme colors — passed from parent to stay Modal-safe */
  resolvedColors: ThemeColors;
  /** Whether the current layout direction is RTL */
  isRtl: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const WelcomeStep: React.FC<WelcomeStepProps> = ({ resolvedColors: c, isRtl }) => {
  const { t } = useTranslation();

  const textAlign = isRtl ? 'right' : 'left';

  return (
    <View style={styles.container}>
      {/* ── App icon ──────────────────────────────────────────────────────── */}
      <View style={styles.iconWrapper}>
        <Ionicons
          name="ticket-outline"
          size={80}
          color={c.interactive.primary}
        />
      </View>

      {/* ── App name ──────────────────────────────────────────────────────── */}
      <Text
        style={[styles.appName, { color: c.text.primary, textAlign }]}
        accessibilityRole="header"
      >
        TicketFlow Pro
      </Text>

      {/* ── Tagline ───────────────────────────────────────────────────────── */}
      <Text
        style={[styles.tagline, { color: c.text.secondary, textAlign }]}
      >
        {t('onboarding.welcome.tagline')}
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Static styles — no color values here (all colors come from resolvedColors)
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingStart: 32,
    paddingEnd: 32,
    paddingVertical: 24,
  },
  iconWrapper: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});

export default WelcomeStep;
