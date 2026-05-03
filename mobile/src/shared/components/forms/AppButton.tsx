/**
 * AppButton — theme-aware button for screens and modals.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 * - AdminFormPage (features/admin/shared/AdminFormPage.tsx) — footer Save/Cancel
 * - AdminFormModal (features/admin/shared/AdminFormModal.tsx) — Submit button
 * - AppEmptyState (shared/components/feedback/AppEmptyState.tsx) — action CTA
 * - Settings panels — any screen-level CTA
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIANTS
 * ─────────────────────────────────────────────────────────────────────────────
 * primary | secondary | outline | ghost | danger | success
 * Legacy aliases: contained → primary, outlined → outline, text → ghost
 *
 * SIZES: small | medium | large
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 * <AppButton variant="primary" onPress={handleSave}>Save</AppButton>
 * <AppButton variant="danger"  size="small" onPress={handleDelete}>Delete</AppButton>
 * <AppButton variant="outline" fullWidth onPress={handleCancel}>Cancel</AppButton>
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors(), useIsDark(), useDirection() internally.
 * Pass `resolvedColors` when rendering inside a <Modal> to bypass context:
 *   const c = useThemeColors();
 *   <AppButton resolvedColors={c} variant="primary" onPress={fn}>Save</AppButton>
 * When inside a Modal also pass isRtlOverride={isRtl} to preserve RTL text.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, View,
  type ViewStyle, type TextStyle,
} from 'react-native';
import { useThemeColors, useIsDark, Radius, FontSize, FontWeight } from '@/src/constants/theme';
import { useDirection } from '@/src/providers/DirectionProvider';
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
  /** Text style override for the button label. */
  labelStyle?:     TextStyle;
  /** Pass when rendering inside a <Modal> to bypass context issues */
  resolvedColors?: ThemeColors;
  /** Pass when rendering inside a <Modal> where useDirection() is unavailable */
  isRtlOverride?:  boolean;
}

// ── Size tokens ───────────────────────────────────────────────────────────────

const SIZES: Record<AppButtonSize, { pv: number; ph: number; fs: number; fw: string; minH: number; gap: number; r: number }> = {
  small:  { pv: 9,  ph: 18, fs: FontSize.sm,   fw: FontWeight.semibold, minH: 36, gap: 5, r: Radius.xl },
  medium: { pv: 12, ph: 22, fs: FontSize.base,  fw: FontWeight.bold,    minH: 44, gap: 6, r: Radius.xl },
  large:  { pv: 15, ph: 26, fs: FontSize.md,    fw: FontWeight.bold,    minH: 52, gap: 8, r: Radius['2xl'] },
};

// ── Color resolver ────────────────────────────────────────────────────────────

interface BtnColors { bg: string; text: string; border: string | null; shadow: string | null }

function getColors(v: string, disabled: boolean, pressed: boolean, c: ThemeColors): BtnColors {
  if (disabled) return { bg: c.interactive.disabled, text: c.text.muted, border: null, shadow: null };

  switch (v) {
    case 'primary':
      return { bg: pressed ? c.buttons.primary.pressed  : c.buttons.primary.bg,  text: c.buttons.primary.text,  border: null,                      shadow: c.buttons.primary.bg  };
    case 'success':
      return { bg: pressed ? c.buttons.success.pressed  : c.buttons.success.bg,  text: c.buttons.success.text,  border: null,                      shadow: c.buttons.success.bg  };
    case 'danger':
      return { bg: pressed ? c.buttons.danger.pressed   : c.buttons.danger.bg,   text: c.buttons.danger.text,   border: null,                      shadow: c.buttons.danger.bg   };
    case 'secondary':
      return { bg: pressed ? c.interactive.pressed      : c.buttons.secondary.bg, text: c.buttons.secondary.text, border: c.buttons.secondary.border, shadow: null                };
    case 'outline':
      return { bg: pressed ? c.buttons.outline.border + '18' : 'transparent', text: c.buttons.outline.text, border: c.buttons.outline.border, shadow: null };
    case 'ghost':
      return { bg: pressed ? c.buttons.ghost.text + '14' : 'transparent', text: c.buttons.ghost.text, border: null, shadow: null };
    default:
      return { bg: pressed ? c.buttons.primary.pressed  : c.buttons.primary.bg,  text: c.buttons.primary.text,  border: null,                      shadow: c.buttons.primary.bg  };
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
  labelStyle,
  resolvedColors,
  isRtlOverride,
}: AppButtonProps) => {
  const hookColors    = useThemeColors();
  const isDark        = useIsDark();
  const { isRtl: dirIsRtl } = useDirection();
  const c             = resolvedColors ?? hookColors;
  const isRtl         = isRtlOverride ?? dirIsRtl;

  const [pressed, setPressed] = useState(false);

  const sz         = SIZES[size];
  const isDisabled = disabled || loading;
  const label      = loading && loadingText ? loadingText : children;

  // Normalize legacy variant names
  const v = variant === 'contained' ? 'primary'
          : variant === 'outlined'  ? 'outline'
          : variant === 'text'      ? 'ghost'
          : variant;

  const colors    = getColors(v, isDisabled, pressed, c);
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
          opacity:           isDisabled ? 0.5 : pressed ? 0.9 : 1,
          width:             fullWidth ? '100%' : undefined,
          transform:         [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
        hasShadow && colors.shadow && {
          shadowColor:   colors.shadow,
          shadowOffset:  { width: 0, height: size === 'large' ? 5 : 3 },
          shadowOpacity: isDark ? 0.55 : 0.32,
          shadowRadius:  size === 'large' ? 12 : 7,
          elevation:     size === 'large' ? 7 : 4,
        },
        style,
      ]}
    >
      {/* Loading spinner — sits at the inline-start side */}
      {loading && (
        <ActivityIndicator
          size="small"
          color={colors.text}
          style={{ marginEnd: sz.gap }}
        />
      )}

      {/* Left icon — flip margin direction for RTL so gap is always between icon and text */}
      {!loading && leftIcon && (
        <View style={isRtl ? { marginStart: sz.gap } : { marginEnd: sz.gap }}>
          {leftIcon}
        </View>
      )}

      <Text
        style={[
          styles.label,
          {
            fontSize:         sz.fs,
            fontWeight:       sz.fw as TextStyle['fontWeight'],
            color:            colors.text,
            // RTL: remove letter-spacing (breaks Arabic shaping) + set writing direction
            letterSpacing:    isRtl ? 0 : 0.3,
            writingDirection: isRtl ? 'rtl' : 'ltr',
          },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Right icon */}
      {!loading && rightIcon && (
        <View style={isRtl ? { marginEnd: sz.gap } : { marginStart: sz.gap }}>
          {rightIcon}
        </View>
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
    textAlign:          'center',
    includeFontPadding: false,
  },
});

export default AppButton;
