import React from 'react';
import { ActivityIndicator, Pressable, Text, StyleSheet, View } from 'react-native';
import { useThemeColors, useIsDark, Radius, FontSize, FontWeight } from '@/src/constants/theme';
import { PressableStateCallbackType } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline';

export default function AppButton({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
}: any) {
  const c = useThemeColors();
  const isDark = useIsDark();

  const isDisabled = disabled || loading;

  const getBg = () => {
    if (variant === 'primary') return c.interactive.primary;
    if (variant === 'secondary') return c.surface.tertiary;
    return 'transparent';
  };

  const getText = () => {
    if (variant === 'primary') return c.text.primary;
    if (variant === 'secondary') return c.text.primary;
    return c.interactive.primary;
  };

  const getBorder = () => {
    if (variant === 'outline') return c.interactive.primary;
    return 'transparent';
  };

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.base,
        {
          backgroundColor: getBg(),
          borderColor: getBorder(),
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },

        // 🔥 shadow يخلي الزرار واضح
        variant === 'primary' && {
          shadowColor: c.interactive.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.5 : 0.25,
          shadowRadius: 10,
          elevation: 6,
        },
      ]}
    >
      {loading && <ActivityIndicator color={getText()} style={{ marginRight: 6 }} />}

      {!loading && leftIcon && <View style={{ marginRight: 6 }}>{leftIcon}</View>}

      <Text style={[styles.text, { color: getText() }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: Radius.xl,
    borderWidth: 1.5,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
});