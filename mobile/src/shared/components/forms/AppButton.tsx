/**
 * AppButton — theme-aware button for screens.
 *
 * ⚠️  Modal rule: This component calls useThemeColors() internally.
 * When used inside a <Modal>, pass `resolvedColors` prop with colors
 * from the parent's useThemeColors() call to avoid context issues.
 *
 * Usage in screens (normal):
 *   <AppButton variant="primary" onPress={fn}>Save</AppButton>
 *
 * Usage inside Modal (pass resolved colors):
 *   const c = useThemeColors();
 *   <AppButton variant="primary" resolvedColors={c} onPress={fn}>Save</AppButton>
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors, useIsDark, Radius, FontSize, FontWeight } from '@/src/constants/theme';
import type { ThemeColors } from '@/src/constants/tokens';

export type AppButtonVariant =
  | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  | 'contained' | 'outlined' | 'text'; // legacy aliases

export type AppButtonColor = 'primary' | 'error' | 'warning' | 'success' | 'secondary';
export type AppButtonSize  = 'small' | 'medium' | 'large';

export interface AppButtonProps {
  children?:       React.ReactNode;
  onPress?:        () => void;
  variant?:        AppButtonVariant;
  color?:          AppButtonColor;
  size?:           AppButtonSize;
  loading?:        boolean;
  loadingText?:    string;
  disabled?:       boolean;
  fullWidth?:      boolean;
  leftIcon?:       React.ReactNode;
  rightIcon?:      React.ReactNode;
  style?:          object;
  /** Pass when rendering inside a <Modal> to bypass context issues */
  resolvedColors?: ThemeColors;
}

// ── Size tokens ───────────────────────────────────────────────────────────────

const SIZES = {
  small:  { pv: 9,  ph: 16, fs: FontSize.sm,   minH: 36, gap: 5, r: Radius.lg },
  medium: { pv: 12, ph: 20, fs: FontSize.base,  minH: 44, gap: 6, r: Radius.xl },
  large:  { pv: 15, ph: 24, fs: FontSize.md,    minH: 52, gap: 8, r: Radius.xl },
};

// ── Color resolver ────────────────────────────────────────────────────────────

function resolveColors(
  v: string,
  color: AppButtonColor,
  isDisabled: boolean,
  pressed: boolean,
  c: ThemeColors,
  isDark: boolean,
): { bg: string; text: string; border: string | null; shadowColor: string | null } {
  if (isDisabled) {
    return { bg: c.interactive.disabled, text: c.text.muted, border: null, shadowColor: null };
  }

  switch (v) {
    case 'primary':
      return {
        bg:          pressed ? c.buttons.primary.pressed : c.buttons.primary.bg,
        text:        c.buttons.primary.text,
        border:      null,
        shadowColor: c.buttons.primary.bg,
      };
    case 'success':
      return {
        bg:          pressed ? c.buttons.success.pressed : c.buttons.success.bg,
        text:        c.buttons.success.text,
        border:      null,
        shadowColor: c.buttons.success.bg,
      };
    case 'danger':
      return {
        bg:          pressed ? c.buttons.danger.pressed : c.buttons.danger.bg,
        text:        c.buttons.danger.text,
        border:      null,
        shadowColor: c.buttons.danger.bg,
      };
    case 'secondary':
      return {
        bg:          pressed ? c.interactive.pressed : c.buttons.secondary.bg,
        text:        c.buttons.secondary.text,
        border:      c.buttons.secondary.border,
        shadowColor: null,
      };
    case 'outline':
      return {
        bg:          pressed ? c.buttons.outline.border + '18' : 'transparent',
        text:        c.buttons.outline.text,
        border:      c.buttons.outline.border,
        shadowColor: null,
      };
    case 'ghost':
      return {
        bg:          pressed ? c.buttons.ghost.text + '14' : 'transparent',
        text:        c.buttons.ghost.text,
        border:      null,
        shadowColor: null,
      };
    default: {
      // Legacy color prop fallback
      const main    = color === 'error'   ? c.interactive.error
                    : color === 'success' ? c.interactive.success
                    : color === 'warning' ? c.interactive.warning
                    : c.buttons.primary.bg;
      const pressed_ = color === 'error'   ? c.interactive.errorPressed
                     : color === 'success' ? c.interactive.successPressed
                     : color === 'warning' ? c.interactive.warningPressed
                     : c.buttons.primary.pressed;
      return {
        bg:          pressed ? pressed_ : main,
        text:        c.text.inverse,
        border:      null,
        shadowColor: main,
      };
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const AppButton = ({
  children,
  onPress,
  variant        = 'primary',
  color          = 'primary',
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
  // Use resolvedColors if provided (Modal context), otherwise call hook
  const hookColors = useThemeColors();
  const c      = resolvedColors ?? hookColors;
  // Only call useIsDark when not using resolvedColors (avoids context issues in Modal)
  const isDark = useIsDark();

  const sz         = SIZES[size];
  const isDisabled = disabled || loading;

  // Normalize legacy variant names
  const v = variant === 'contained' ? 'primary'
          : variant === 'outlined'  ? 'outline'
          : variant === 'text'      ? 'ghost'
          : variant;

  const hasShadow = (v === 'primary' || v === 'danger' || v === 'success') && !isDisabled;
  const label     = loading && loadingText ? loadingText : children;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }: { pressed: boolean }) => {
        const colors = resolveColors(v, color, isDisabled, pressed, c, isDark);
        return [
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
          hasShadow && colors.shadowColor && {
            shadowColor:   colors.shadowColor,
            shadowOffset:  { width: 0, height: size === 'large' ? 5 : 3 },
            shadowOpacity: isDark ? 0.5 : 0.3,
            shadowRadius:  size === 'large' ? 10 : 6,
            elevation:     size === 'large' ? 6 : 4,
          },
          style,
        ];
      }}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={resolveColors(v, color, isDisabled, false, c, isDark).text}
          style={{ marginEnd: sz.gap }}
        />
      )}
      {!loading && leftIcon && (
        <View style={{ marginEnd: sz.gap }}>{leftIcon}</View>
      )}
      <Text
        style={[
          styles.label,
          {
            fontSize: sz.fs,
            color:    resolveColors(v, color, isDisabled, false, c, isDark).text,
          },
        ]}
        numberOfLines={1}
      >
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
