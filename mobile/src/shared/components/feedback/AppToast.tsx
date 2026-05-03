import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BaseToastProps } from 'react-native-toast-message';
import { Palette, Colors } from '@/src/constants/tokens';
import { useIsDark, FontSize, FontWeight } from '@/src/constants/theme';

/**
 * AppToast
 *
 * Custom toast renderer for `react-native-toast-message`.
 * Provides `success`, `error`, `info`, and `warning` variants.
 *
 * ## Setup
 * Pass `toastConfig` to the `<Toast />` component in the root layout:
 * ```tsx
 * // app/_layout.tsx
 * import Toast from 'react-native-toast-message';
 * import { toastConfig } from '@/src/shared/components/feedback/AppToast';
 *
 * <Toast config={toastConfig} />
 * ```
 *
 * ## Usage
 * ```ts
 * import Toast from 'react-native-toast-message';
 *
 * Toast.show({ type: 'success', text1: 'Saved!', text2: 'Customer updated.' });
 * Toast.show({ type: 'error',   text1: 'Failed', text2: 'Could not save.' });
 * Toast.show({ type: 'info',    text1: 'Note',   text2: 'No changes made.' });
 * Toast.show({ type: 'warning', text1: 'Warning', text2: 'Session expiring.' });
 * ```
 *
 * Or use the `useToast()` hook from `@/src/shared/hooks/useToast`.
 *
 * ## Layout
 * ```
 * ┌▌──────────────────────────────────────┐
 * │  [icon]  text1 (bold)                 │
 * │          text2 (muted)                │
 * └───────────────────────────────────────┘
 *  ▌ = colored left border
 * ```
 */

// ── Toast item ────────────────────────────────────────────────────────────────

interface ToastItemProps extends BaseToastProps {
  accentColor: string;
  icon:        string;
}

const ToastItem: React.FC<ToastItemProps> = ({
  text1,
  text2,
  accentColor,
  icon,
  onPress,
}) => {
  // Inverted: toast is dark when app is light, light when app is dark
  const isDark = useIsDark();
  const c = isDark ? Colors.light : Colors.dark;

  // Build accessible label from available text
  const a11yLabel = [text1, text2].filter(Boolean).join('. ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="alert"
      accessibilityLabel={a11yLabel}
      style={[
        styles.container,
        {
          backgroundColor: c.surface.primary,
          borderLeftColor: accentColor,
          shadowColor:     c.shadow,
        },
      ]}
    >
      {/* Icon badge */}
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '22' }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        {!!text1 && (
          <Text
            numberOfLines={2}
            style={[styles.text1, { color: c.text.primary }]}
          >
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text
            numberOfLines={2}
            style={[styles.text2, { color: c.text.secondary }]}
          >
            {text2}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

// ── Toast config ──────────────────────────────────────────────────────────────
// Pass to <Toast config={toastConfig} /> in the root layout.

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastItem {...props} accentColor={Palette.green500}  icon="✅" />
  ),
  error: (props: BaseToastProps) => (
    <ToastItem {...props} accentColor={Palette.red500}    icon="❌" />
  ),
  info: (props: BaseToastProps) => (
    <ToastItem {...props} accentColor={Palette.blue500}   icon="ℹ️" />
  ),
  warning: (props: BaseToastProps) => (
    <ToastItem {...props} accentColor={Palette.amber500}  icon="⚠️" />
  ),
};

// ── Styles — static layout only, colors applied inline ───────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      14,
    borderLeftWidth:   5,
    paddingVertical:   12,
    paddingHorizontal: 14,
    marginHorizontal:  16,
    gap:               12,
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.15,
    shadowRadius:      12,
    elevation:         8,
    minHeight:         56,
  },
  iconWrap: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  textWrap: { flex: 1 },
  text1: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  text2: {
    fontSize:  FontSize.xs,
    marginTop: 2,
  },
});
