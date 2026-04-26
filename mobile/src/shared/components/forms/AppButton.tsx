import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import { Palette } from '@/src/constants/tokens';

export type AppButtonVariant = 'contained' | 'outlined' | 'text';
export type AppButtonColor   = 'primary' | 'error' | 'warning' | 'success' | 'secondary';

// Color mappings using semantic tokens and Palette constants
const getButtonColors = (color: AppButtonColor, variant: AppButtonVariant, c: any) => {
  const colorMap = {
    primary:   { main: c.interactive.primary,        pressed: c.interactive.primaryPressed, text: Palette.blue600   },
    error:     { main: c.interactive.error,          pressed: c.interactive.errorPressed,   text: Palette.red500    },
    warning:   { main: Palette.amber500,             pressed: Palette.amber600,             text: Palette.amber500  },
    success:   { main: c.interactive.success,        pressed: c.interactive.successPressed, text: Palette.green500  },
    secondary: { main: c.interactive.secondary,      pressed: c.interactive.pressed,        text: c.text.secondary  },
  };

  const colors = colorMap[color];

  switch (variant) {
    case 'contained':
      return {
        backgroundColor: colors.main,
        pressedBackgroundColor: colors.pressed,
        borderColor: colors.main,
        textColor: c.text.inverse,
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        pressedBackgroundColor: colors.main + '18',
        borderColor: colors.main,
        textColor: colors.text,
      };
    case 'text':
      return {
        backgroundColor: 'transparent',
        pressedBackgroundColor: colors.main + '18',
        borderColor: 'transparent',
        textColor: colors.text,
      };
    default:
      return {
        backgroundColor: colors.main,
        pressedBackgroundColor: colors.pressed,
        borderColor: colors.main,
        textColor: c.text.inverse,
      };
  }
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return { paddingVertical: 8, paddingHorizontal: 12, fontSize: FontSize.sm };
    case 'large':
      return { paddingVertical: 16, paddingHorizontal: 24, fontSize: FontSize.lg };
    default: // medium
      return { paddingVertical: 12, paddingHorizontal: 20, fontSize: FontSize.base };
  }
};

export interface AppButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: AppButtonVariant;
  color?: AppButtonColor;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
}

const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'contained',
  color = 'primary',
  loading = false,
  loadingText,
  disabled = false,
  fullWidth = false,
  size = 'medium',
  style,
  ...rest
}) => {
  const c = useThemeColors();
  const isDisabled = disabled || loading;
  const colors = getButtonColors(color, variant, c);
  const sizeStyles = getSizeStyles(size);
  const spinnerColor = variant === 'contained' ? c.text.inverse : colors.textColor;

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: Radius.lg,
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: colors.borderColor,
          backgroundColor: pressed ? colors.pressedBackgroundColor : colors.backgroundColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: isDisabled ? 0.5 : 1,
          ...(fullWidth && { width: '100%' }),
        },
        style,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      {...rest}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={spinnerColor}
          style={{ marginEnd: 8 }}
        />
      )}
      <Text style={{
        fontWeight: FontWeight.semibold,
        textAlign: 'center',
        color: colors.textColor,
        fontSize: sizeStyles.fontSize,
      }}>
        {loading && loadingText ? loadingText : children}
      </Text>
    </Pressable>
  );
};

export default AppButton;
