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

  // When color is explicitly set, map it to the equivalent variant so tokens are used correctly.
  // This lets variant="contained" color="error" → danger styling, etc.
  const effectiveV =
    color === 'error'   ? (v === 'outline' ? 'outline-danger' : 'danger')
    : color === 'success' ? (v === 'outline' ? 'outline-success' : 'success')
    : color === 'warning' ? (v === 'outline' ? 'outline-warning' : 'warning-filled')
    : color === 'secondary' ? (v === 'outline' ? 'outline-secondary' : v === 'primary' ? 'secondary' : v)
    : v;

  // ── Resolve colors from c.buttons tokens ─────────────────────────────────
  const getBg = (pressed: boolean): string => {
    if (isDisabled) return c.interactive.disabled;
    switch (effectiveV) {
      case 'primary':          return pressed ? c.buttons.primary.pressed   : c.buttons.primary.bg;
      case 'success':          return pressed ? c.buttons.success.pressed   : c.buttons.success.bg;
      case 'danger':           return pressed ? c.buttons.danger.pressed    : c.buttons.danger.bg;
      case 'warning-filled':   return pressed ? c.interactive.warningPressed : c.interactive.warning;
      case 'secondary':        return pressed ? c.interactive.pressed       : c.buttons.secondary.bg;
      case 'outline':          return pressed ? c.buttons.outline.border + '18' : 'transparent';
      case 'outline-danger':   return pressed ? c.buttons.danger.bg + '22'  : 'transparent';
      case 'outline-success':  return pressed ? c.buttons.success.bg + '22' : 'transparent';
      case 'outline-warning':  return pressed ? c.interactive.warning + '22' : 'transparent';
      case 'outline-secondary':return pressed ? c.interactive.pressed       : 'transparent';
      case 'ghost':            return pressed ? c.buttons.ghost.text + '14' : 'transparent';
      default:                 return pressed ? c.buttons.primary.pressed   : c.buttons.primary.bg;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) return c.text.muted;
    switch (effectiveV) {
      case 'primary':           return c.buttons.primary.text;
      case 'success':           return c.buttons.success.text;
      case 'danger':            return c.buttons.danger.text;
      case 'warning-filled':    return c.buttons.primary.text;
      case 'secondary':         return c.buttons.secondary.text;
      case 'outline':           return c.buttons.outline.text;
      case 'outline-danger':    return c.buttons.danger.bg;
      case 'outline-success':   return c.buttons.success.bg;
      case 'outline-warning':   return c.interactive.warning;
      case 'outline-secondary': return c.buttons.secondary.text;
      case 'ghost':             return c.buttons.ghost.text;
      default:                  return c.buttons.primary.text;
    }
  };

  const getBorder = (): string | null => {
    if (effectiveV === 'outline')           return c.buttons.outline.border;
    if (effectiveV === 'outline-danger')    return c.buttons.danger.bg;
    if (effectiveV === 'outline-success')   return c.buttons.success.bg;
    if (effectiveV === 'outline-warning')   return c.interactive.warning;
    if (effectiveV === 'outline-secondary') return c.buttons.secondary.border;
    if (effectiveV === 'secondary')         return c.buttons.secondary.border;
    return null;
  };

  const textColor  = getTextColor();
  const border     = getBorder();
  const hasShadow  = (effectiveV === 'primary' || effectiveV === 'danger' || effectiveV === 'success') && !isDisabled;
  const shadowColor = effectiveV === 'danger'  ? c.buttons.danger.bg
                    : effectiveV === 'success' ? c.buttons.success.bg
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
