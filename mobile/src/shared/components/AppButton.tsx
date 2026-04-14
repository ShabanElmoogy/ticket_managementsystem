import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export type AppButtonVariant = 'contained' | 'outlined' | 'text';
export type AppButtonColor   = 'primary' | 'error' | 'warning' | 'success' | 'secondary';

const VARIANT_CLASSES: Record<AppButtonColor, Record<AppButtonVariant, string>> = {
  primary:   { contained: 'bg-blue-600 border-blue-600',   outlined: 'border border-blue-600 bg-transparent', text: 'bg-transparent' },
  error:     { contained: 'bg-red-500 border-red-500',     outlined: 'border border-red-500 bg-transparent',  text: 'bg-transparent' },
  warning:   { contained: 'bg-amber-500 border-amber-500', outlined: 'border border-amber-500 bg-transparent',text: 'bg-transparent' },
  success:   { contained: 'bg-emerald-500 border-emerald-500', outlined: 'border border-emerald-500 bg-transparent', text: 'bg-transparent' },
  secondary: { contained: 'bg-gray-500 border-gray-500',   outlined: 'border border-gray-500 bg-transparent', text: 'bg-transparent' },
};

const TEXT_CLASSES: Record<AppButtonColor, Record<AppButtonVariant, string>> = {
  primary:   { contained: 'text-white', outlined: 'text-blue-600',    text: 'text-blue-600'    },
  error:     { contained: 'text-white', outlined: 'text-red-500',     text: 'text-red-500'     },
  warning:   { contained: 'text-white', outlined: 'text-amber-500',   text: 'text-amber-500'   },
  success:   { contained: 'text-white', outlined: 'text-emerald-500', text: 'text-emerald-500' },
  secondary: { contained: 'text-white', outlined: 'text-gray-500',    text: 'text-gray-500'    },
};

const SIZE_CLASSES = {
  small:  { btn: 'py-2 px-3', text: 'text-sm' },
  medium: { btn: 'py-3 px-5', text: 'text-base' },
  large:  { btn: 'py-4 px-6', text: 'text-lg'  },
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
  const isDisabled = disabled || loading;
  const spinnerColor = variant === 'contained' ? '#fff' : undefined;

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-lg ${VARIANT_CLASSES[color][variant]} ${SIZE_CLASSES[size].btn} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : 'active:opacity-75'}`}
      disabled={isDisabled}
      accessibilityRole="button"
      style={style}
      {...rest}
    >
      {loading && (
        <ActivityIndicator size="small" color={spinnerColor} className="mr-2" />
      )}
      <Text className={`font-semibold text-center ${TEXT_CLASSES[color][variant]} ${SIZE_CLASSES[size].text}`}>
        {loading && loadingText ? loadingText : children}
      </Text>
    </Pressable>
  );
};

export default AppButton;
