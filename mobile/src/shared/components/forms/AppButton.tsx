/**
 * AppButton — modern, theme-aware button for React Native.
 *
 * Variants:  primary | secondary | outline | ghost | danger
 *            + legacy: contained | outlined | text
 * Sizes:     small | medium | large
 * States:    normal | pressed | disabled | loading
 * Icons:     leftIcon / rightIcon (any React node)
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import type { ThemeColors } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AppButtonVariant =
  | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  | 'contained' | 'outlined' | 'text'; // legacy aliases

export type AppButtonColor = 'primary' | 'error' | 'warning' | 'success' | 'secondary';
export type AppButtonSize  = 'small' | 'medium' | 'large';

export interface AppButtonProps extends Omit<PressableProps, 'style'> {
  children:     React.ReactNode;
  variant?:     AppButtonVariant;
  color?:       AppButtonColor;
  size?:        AppButtonSize;
  loading?:     boolean;
  loadingText?: string;
  disabled?:    boolean;
  fullWidth?:   boolean;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  style?:       ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token resolver
// ─────────────────────────────────────────────────────────────────────────────

interface BtnTokens {
  bg:         string;
  bgPressed:  string;
  bgDisabled: string;
  border:     string | null;
  text:       string;
  shadow:     boolean;
}

function resolveTokens(variant: AppButtonVariant, color: AppButtonColor, c: ThemeColors): BtnTokens {
  // Normalize legacy names
  const v = variant === 'contained' ? 'primary'
          : variant === 'outlined'  ? 'outline'
          : variant === 'text'      ? 'ghost'
          : variant;

  const colorMain    = color === 'error'    ? c.interactive.error
                     : color === 'success'  ? c.interactive.success
                     : color === 'warning'  ? '#f59e0b'
                     : color === 'secondary'? c.interactive.secondary
                     : c.interactive.primary;

  const colorPressed = color === 'error'    ? c.interactive.errorPressed
                     : color === 'success'  ? c.interactive.successPressed
                     : color === 'warning'  ? '#d97706'
                     : color === 'secondary'? c.interactive.pressed
                     : c.interactive.primaryPressed;

  switch (v) {
    case 'primary':
      return { bg: c.interactive.primary, bgPressed: c.interactive.primaryPressed, bgDisabled: c.interactive.disabled, border: null, text: c.text.inverse, shadow: true };
    case 'secondary':
      return { bg: c.surface.tertiary, bgPressed: c.surface.elevated, bgDisabled: c.interactive.disabled, border: c.border.primary, text: c.text.primary, shadow: false };
    case 'outline':
      return { bg: 'transparent', bgPressed: colorMain + '18', bgDisabled: 'transparent', border: colorMain, text: colorMain, shadow: false };
    case 'ghost':
      return { bg: 'transparent', bgPressed: c.interactive.primary + '14', bgDisabled: 'transparent', border: null, text: c.interactive.primary, shadow: false };
    case 'danger':
      return { bg: c.interactive.error, bgPressed: c.interactive.errorPressed, bgDisabled: c.interactive.disabled, border: null, text: c.text.inverse, shadow: true };
    default:
      return { bg: colorMain, bgPressed: colorPressed, bgDisabled: c.interactive.disabled, border: null, text: c.text.inverse, shadow: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Size tokens
// ─────────────────────────────────────────────────────────────────────────────

const SIZES: Record<AppButtonSize, { pv: number; ph: number; fs: number; gap: number; radius: number; minH: number }> = {
  small:  { pv: 8,  ph: 14, fs: FontSize.sm,   gap: 5, radius: Radius.md, minH: 32 },
  medium: { pv: 12, ph: 20, fs: FontSize.base,  gap: 6, radius: Radius.lg, minH: 44 },
  large:  { pv: 15, ph: 24, fs: FontSize.lg,    gap: 8, radius: Radius.xl, minH: 52 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant   = 'primary',
  color     = 'primary',
  size      = 'medium',
  loading   = false,
  loadingText,
  disabled  = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  onPress,
  ...rest
}) => {
  const c          = useThemeColors();
  const tokens     = resolveTokens(variant, color, c);
  const sz         = SIZES[size];
  const isDisabled = disabled || loading;
  const label      = loading && loadingText ? loadingText : children;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.base,
        tokens.shadow && !isDisabled && styles.shadow,
        {
          paddingVertical:   sz.pv,
          paddingHorizontal: sz.ph,
          borderRadius:      sz.radius,
          minHeight:         sz.minH,
          backgroundColor:   isDisabled ? tokens.bgDisabled : pressed ? tokens.bgPressed : tokens.bg,
          borderWidth:       tokens.border ? 1.5 : 0,
          borderColor:       tokens.border ?? 'transparent',
          opacity:           isDisabled ? 0.55 : pressed ? 0.92 : 1,
          width:             fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {/* Spinner */}
      {loading && (
        <ActivityIndicator size="small" color={tokens.text} style={{ marginEnd: sz.gap }} />
      )}

      {/* Left icon */}
      {!loading && leftIcon && (
        <View style={{ marginEnd: sz.gap }}>{leftIcon}</View>
      )}

      {/* Label */}
      <Text style={[
        styles.label,
        {
          fontSize:      sz.fs,
          color:         isDisabled ? c.text.muted : tokens.text,
          letterSpacing: size === 'large' ? 0.4 : 0.1,
        },
      ]} numberOfLines={1}>
        {label}
      </Text>

      {/* Right icon */}
      {!loading && rightIcon && (
        <View style={{ marginStart: sz.gap }}>{rightIcon}</View>
      )}
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  label: {
    fontWeight:          FontWeight.semibold,
    textAlign:           'center',
    includeFontPadding:  false,
  },
  shadow: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius:  4,
    elevation:     3,
  },
});

export default AppButton;
