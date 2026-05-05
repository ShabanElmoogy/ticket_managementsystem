import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BaseToastProps } from 'react-native-toast-message';
import { useThemeColors, useIsDark, FontSize, FontWeight } from '@/src/constants/theme';
import { Colors } from '@/src/constants/tokens';

/**
 * AppToast
 *
 * Custom toast renderer for `react-native-toast-message`.
 * Provides `success`, `error`, `info`, and `warning` variants.
 * Accent colors are read from `useThemeColors()` so they update with palette changes.
 *
 * ## Setup
 * ```tsx
 * // app/_layout.tsx
 * import Toast from 'react-native-toast-message';
 * import { toastConfig } from '@/src/shared/components/feedback/AppToast';
 * <Toast config={toastConfig} />
 * ```
 *
 * ## Usage
 * ```ts
 * Toast.show({ type: 'success', text1: 'Saved!', text2: 'Customer updated.' });
 * Toast.show({ type: 'error',   text1: 'Failed', text2: 'Could not save.' });
 * Toast.show({ type: 'info',    text1: 'Note',   text2: 'No changes made.' });
 * Toast.show({ type: 'warning', text1: 'Warning', text2: 'Session expiring.' });
 * ```
 */

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItemProps extends BaseToastProps {
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, string> = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

const ToastItem: React.FC<ToastItemProps> = ({ text1, text2, variant, onPress }) => {
  const c      = useThemeColors();
  const isDark = useIsDark();

  // Inverted surface: toast is dark when app is light, light when app is dark
  const surface = isDark ? Colors.light : Colors.dark;

  const accentColor =
    variant === 'success' ? c.intent.success  :
    variant === 'error'   ? c.intent.error    :
    variant === 'warning' ? c.intent.warning  :
                            c.intent.info;

  const a11yLabel = [text1, text2].filter(Boolean).join('. ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="alert"
      accessibilityLabel={a11yLabel}
      style={[
        styles.container,
        {
          backgroundColor: surface.surface.primary,
          borderLeftColor: accentColor,
          shadowColor:     surface.shadow,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '22' }]}>
        <Text style={styles.iconText}>{ICONS[variant]}</Text>
      </View>

      <View style={styles.textWrap}>
        {!!text1 && (
          <Text numberOfLines={2} style={[styles.text1, { color: surface.text.primary }]}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text numberOfLines={2} style={[styles.text2, { color: surface.text.secondary }]}>
            {text2}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export const toastConfig = {
  success: (props: BaseToastProps) => <ToastItem {...props} variant="success" />,
  error:   (props: BaseToastProps) => <ToastItem {...props} variant="error"   />,
  info:    (props: BaseToastProps) => <ToastItem {...props} variant="info"    />,
  warning: (props: BaseToastProps) => <ToastItem {...props} variant="warning" />,
};

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
  text1:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  text2:    { fontSize: FontSize.xs, marginTop: 2 },
});
