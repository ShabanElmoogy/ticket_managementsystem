/**
 * AppButton — theme-aware button for screens and modals.
 *
 * VARIANTS: primary | secondary | outline | ghost | danger | success
 * SIZES:    small | medium | large
 *
 * ⚠️ MODAL RULE: calls useThemeColors() internally.
 * Pass `resolvedColors` when rendering inside a <Modal>:
 *   const c = useThemeColors();
 *   <AppButton resolvedColors={c} variant="primary" onPress={fn}>Save</AppButton>
 *
 * USED IN: AdminFormPage footer, settings panels, any screen-level CTA.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, View,
  type ViewStyle,
} from 'react-native';
import { useThemeColors, useIsDark, Radius, FontSize, FontWeight } from '@/src/constants/theme';
import type { ThemeColors } from '@/src/constants/tokens';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppButtonVariant =
  | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  | 'contained' | 'outlined' | 'text'; // legacy aliases

export type AppButtonSize = 'small' | 'medium' | 'large';

export interface AppButtonProps {
  children?:       React.ReactNode;
  onPress?:        () => void;
  variant?:        AppButtonVariant;
  size?:           AppButtonSize;
  loading?:        boolean;
  loadingText?:    string;
  disabled?:       boolean;
  fullWidth?:      boolean;
  leftIcon?:       React.ReactNode;
  rightIcon?:      React.ReactNode;
  style?:          ViewStyle;
  /** Pass when rendering inside a <Modal> to bypass context issues */
  resolvedColors?: ThemeColors;
}

// ── Size tokens ───────────────────────────────────────────────────────────────

const SIZES: Record<AppButtonSize, { pv: number; ph: number; fs: number; minH: number; gap: number; r: number }> = {
  small:  { pv: 9,  ph: 16, fs: FontSize.sm,   minH: 36, gap: 5, r: Radius.lg },
  medium: { pv: 12, ph: 20, fs: FontSize.base,  minH: 44, gap: 6, r: Radius.xl },
  large:  { pv: 15, ph: 24, fs: FontSize.md,    minH: 52, gap: 8, r: Radius.xl },
};

// ── Color resolver ────────────────────────────────────────────────────────────

interface BtnColors { bg: string; text: string; border: string | null; shadow: string | null }

function getColors(v: string, disabled: boolean, pressed: boolean, c: ThemeColors, isDark: boolean): BtnColors {
  if (disabled) return { bg: c.interactive.disabled, text: c.text.muted, border: null, shadow: null };

  switch (v) {
    case 'primary':
      return { bg: pressed ? c.buttons.primary.pressed : c.buttons.primary.bg, text: c.buttons.primary.text, border: null, shadow: c.buttons.primary.bg };
    case 'success':
      return { bg: pressed ? c.buttons.success.pressed : c.buttons.success.bg, text: c.buttons.success.text, border: null, shadow: c.buttons.success.bg };
    case 'danger':
      return { bg: pressed ? c.buttons.danger.pressed  : c.buttons.danger.bg,  text: c.buttons.danger.text,  border: null, shadow: c.buttons.danger.bg  };
    case 'secondary':
      return { bg: pressed ? c.interactive.pressed : c.buttons.secondary.bg, text: c.buttons.secondary.text, border: c.buttons.secondary.border, shadow: null };
    case 'outline':
      return { bg: pressed ? c.buttons.outline.border + '18' : 'transparent', text: c.buttons.outline.text, border: c.buttons.outline.border, shadow: null };
    case 'ghost':
      return { bg: pressed ? c.buttons.ghost.text + '14' : 'transparent', text: c.buttons.ghost.text, border: null, shadow: null };
    default:
      return { bg: pressed ? c.buttons.primary.pressed : c.buttons.primary.bg, text: c.buttons.primary.text, border: null, shadow: c.buttons.primary.bg };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const AppButton = ({
  children,
  onPress,
  variant        = 'primary',
  size           = 'medium',
  loading        = false,
  loadingText,
  disabled       = false,
  fullWidth      = false,
  leftIcon,
  rightIcon,
  style,
  resolvedColors,
}: AppButtonProps) => {
  const hookColors = useThemeColors();
  const isDark     = useIsDark();
  const c          = resolvedColors ?? hookColors;

  // Track pressed state manually so children can react to it
  const [pressed, setPressed] = useState(false);

  const sz         = SIZES[size];
  const isDisabled = disabled || loading;
  const label      = loading && loadingText ? loadingText : children;

  // Normalize legacy variant names
  const v = variant === 'contained' ? 'primary'
          : variant === 'outlined'  ? 'outline'
          : variant === 'text'      ? 'ghost'
          : variant;

  // Resolve colors once — used for both container and text
  const colors    = getColors(v, isDisabled, pressed, c, isDark);
  const hasShadow = (v === 'primary' || v === 'danger' || v === 'success') && !isDisabled;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        {
          minHeight:         sz.minH,
          paddingVertical:   sz.pv,
          paddingHorizontal: sz.ph,
          borderRadius:      sz.r,
          backgroundColor:   colors.bg,
          borderWidth:       colors.border ? 1.5 : 0,
          borderColor:       colors.border ?? 'transparent',
          opacity:           isDisabled ? 0.52 : pressed ? 0.88 : 1,
          width:             fullWidth ? '100%' : undefined,
        },
        hasShadow && colors.shadow && {
          shadowColor:   colors.shadow,
          shadowOffset:  { width: 0, height: size === 'large' ? 5 : 3 },
          shadowOpacity: isDark ? 0.5 : 0.3,
          shadowRadius:  size === 'large' ? 10 : 6,
          elevation:     size === 'large' ? 6 : 4,
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator size="small" color={colors.text} style={{ marginEnd: sz.gap }} />
      )}
      {!loading && leftIcon && (
        <View style={{ marginEnd: sz.gap }}>{leftIcon}</View>
      )}
      <Text style={[styles.label, { fontSize: sz.fs, color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
      {!loading && rightIcon && (
        <View style={{ marginStart: sz.gap }}>{rightIcon}</View>
      )}
    </Pressable>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  label: {
    fontWeight:         FontWeight.semibold,
    textAlign:          'center',
    includeFontPadding: false,
    letterSpacing:      0.2,
  },
});

export default AppButton;
