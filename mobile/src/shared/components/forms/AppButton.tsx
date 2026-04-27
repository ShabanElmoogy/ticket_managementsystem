import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors, useIsDark, Radius, FontSize, FontWeight } from '@/src/constants/theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  | 'contained' | 'outlined' | 'text'; // legacy aliases
export type AppButtonColor = 'primary' | 'error' | 'warning' | 'success' | 'secondary';
export type AppButtonSize  = 'small' | 'medium' | 'large';

export interface AppButtonProps {
  children?:    React.ReactNode;
  onPress?:     () => void;
  variant?:     AppButtonVariant;
  color?:       AppButtonColor;
  size?:        AppButtonSize;
  loading?:     boolean;
  loadingText?: string;
  disabled?:    boolean;
  fullWidth?:   boolean;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  style?:       object;
}

const SIZES = {
  small:  { pv: 9,  ph: 16, fs: FontSize.sm,   minH: 36, gap: 5, r: Radius.lg },
  medium: { pv: 12, ph: 20, fs: FontSize.base,  minH: 44, gap: 6, r: Radius.xl },
  large:  { pv: 15, ph: 24, fs: FontSize.md,    minH: 52, gap: 8, r: Radius.xl },
};

const AppButton = ({
  children,
  onPress,
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
}: AppButtonProps) => {
  const c      = useThemeColors();
  const isDark = useIsDark();
  const sz     = SIZES[size];
  const isDisabled = disabled || loading;

  // Normalize legacy variant names
  const v = variant === 'contained' ? 'primary'
          : variant === 'outlined'  ? 'outline'
          : variant === 'text'      ? 'ghost'
          : variant;

  // ── Resolve colors from c.buttons tokens ─────────────────────────────────
  const getBg = (pressed: boolean): string => {
    if (isDisabled) return c.interactive.disabled;
    switch (v) {
      case 'primary':   return pressed ? c.buttons.primary.pressed   : c.buttons.primary.bg;
      case 'success':   return pressed ? c.buttons.success.pressed   : c.buttons.success.bg;
      case 'danger':    return pressed ? c.buttons.danger.pressed    : c.buttons.danger.bg;
      case 'secondary': return pressed ? c.interactive.pressed       : c.buttons.secondary.bg;
      case 'outline':   return pressed ? c.buttons.outline.border + '18' : 'transparent';
      case 'ghost':     return pressed ? c.buttons.ghost.text + '14'    : 'transparent';
      // legacy color prop fallback
      default:
        if (color === 'error')   return pressed ? c.interactive.errorPressed   : c.interactive.error;
        if (color === 'success') return pressed ? c.interactive.successPressed : c.interactive.success;
        if (color === 'warning') return pressed ? c.interactive.warningPressed : c.interactive.warning;
        return pressed ? c.buttons.primary.pressed : c.buttons.primary.bg;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) return c.text.muted;
    switch (v) {
      case 'primary':   return c.buttons.primary.text;
      case 'success':   return c.buttons.success.text;
      case 'danger':    return c.buttons.danger.text;
      case 'secondary': return c.buttons.secondary.text;
      case 'outline':   return c.buttons.outline.text;
      case 'ghost':     return c.buttons.ghost.text;
      default:
        if (color === 'error')   return c.buttons.danger.text;
        if (color === 'success') return c.buttons.success.text;
        return c.buttons.primary.text;
    }
  };

  const getBorder = (): string | null => {
    if (v === 'outline')   return c.buttons.outline.border;
    if (v === 'secondary') return c.buttons.secondary.border;
    return null;
  };

  const textColor  = getTextColor();
  const border     = getBorder();
  const hasShadow  = (v === 'primary' || v === 'danger' || v === 'success') && !isDisabled;
  const shadowColor = v === 'danger'  ? c.buttons.danger.bg
                    : v === 'success' ? c.buttons.success.bg
                    : c.buttons.primary.bg;

  const label = loading && loadingText ? loadingText : children;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.base,
        {
          minHeight:         sz.minH,
          paddingVertical:   sz.pv,
          paddingHorizontal: sz.ph,
          borderRadius:      sz.r,
          backgroundColor:   getBg(pressed),
          borderWidth:       border ? 1.5 : 0,
          borderColor:       border ?? 'transparent',
          opacity:           isDisabled ? 0.52 : pressed ? 0.88 : 1,
          width:             fullWidth ? '100%' : undefined,
        },
        hasShadow && {
          shadowColor,
          shadowOffset:  { width: 0, height: size === 'large' ? 5 : 3 },
          shadowOpacity: isDark ? 0.5 : 0.3,
          shadowRadius:  size === 'large' ? 10 : 6,
          elevation:     size === 'large' ? 6 : 4,
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator size="small" color={textColor} style={{ marginEnd: sz.gap }} />
      )}
      {!loading && leftIcon && (
        <View style={{ marginEnd: sz.gap }}>{leftIcon}</View>
      )}
      <Text style={[styles.label, { fontSize: sz.fs, color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
      {!loading && rightIcon && (
        <View style={{ marginStart: sz.gap }}>{rightIcon}</View>
      )}
    </Pressable>
  );
};

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
