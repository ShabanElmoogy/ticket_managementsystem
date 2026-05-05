import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface OnboardingHeaderProps {
  /** 0-indexed current step */
  currentStep: number;
  /** Total number of steps (5) */
  totalSteps: number;
  /** Defined on steps 1–4; undefined on step 0 (no back button rendered) */
  onBack?: () => void;
  /** Defined on steps 0–3; undefined on step 4 (no skip button rendered) */
  onSkip?: () => void;
  /** Resolved theme colors — passed from parent to stay Modal-safe */
  resolvedColors: ThemeColors;
  /** Whether the current layout direction is RTL */
  isRtl: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onSkip,
  resolvedColors: c,
  isRtl,
}) => {
  const { t } = useTranslation();

  const textAlign = isRtl ? 'right' : 'left';

  return (
    <View style={styles.container}>
      {/* ── Back button (left slot) ─────────────────────────────────────── */}
      <View style={styles.sideSlot}>
        {onBack !== undefined ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.back')}
            style={({ pressed }: { pressed: boolean }) => [
              styles.iconButton,
              { backgroundColor: pressed ? c.interactive.pressed : 'transparent' },
            ]}
          >
            <Ionicons
              name="arrow-back-outline"
              size={22}
              color={c.text.secondary}
            />
          </Pressable>
        ) : (
          // Empty placeholder keeps the step indicator centered
          <View style={styles.iconButtonPlaceholder} />
        )}
      </View>

      {/* ── Step progress indicator (center) ───────────────────────────── */}
      <View style={styles.centerSlot}>
        <Text
          style={[styles.stepText, { color: c.text.secondary, textAlign }]}
          accessibilityRole="text"
          accessibilityLabel={t('onboarding.stepOf', {
            current: currentStep + 1,
            total: totalSteps,
          })}
        >
          {t('onboarding.stepOf', {
            current: currentStep + 1,
            total: totalSteps,
          })}
        </Text>
      </View>

      {/* ── Skip button (right slot) ────────────────────────────────────── */}
      <View style={styles.sideSlot}>
        {onSkip !== undefined ? (
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.skip')}
            style={({ pressed }: { pressed: boolean }) => [
              styles.skipButton,
              { backgroundColor: pressed ? c.interactive.pressed : 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.skipText,
                { color: c.interactive.primary, textAlign },
              ]}
            >
              {t('onboarding.skip')}
            </Text>
          </Pressable>
        ) : (
          // Empty placeholder keeps the step indicator centered
          <View style={styles.skipButtonPlaceholder} />
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Static styles — no color values here (all colors come from resolvedColors)
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingStart: 8,
    paddingEnd: 16,
  },
  sideSlot: {
    width: 72,
    alignItems: 'flex-start',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 4,
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
    marginStart: 4,
  },
  skipButton: {
    paddingVertical: 8,
    paddingStart: 8,
    paddingEnd: 4,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  skipButtonPlaceholder: {
    width: 48,
    height: 36,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default OnboardingHeader;
