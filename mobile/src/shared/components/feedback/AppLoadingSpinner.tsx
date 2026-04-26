import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useThemeColors, FontSize } from '@/src/constants/theme';

export interface AppLoadingSpinnerProps {
  size?:       'small' | 'large';
  color?:      string;
  message?:    string;
  fullScreen?: boolean;
}

const AppLoadingSpinner: React.FC<AppLoadingSpinnerProps> = ({
  size = 'large', color, message, fullScreen = false,
}) => {
  const c           = useThemeColors();
  const spinnerColor = color ?? c.interactive.primary;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24, ...(fullScreen && { flex: 1 }) }}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text style={{ marginTop: 12, fontSize: FontSize.base, color: c.text.muted }}>{message}</Text>
      )}
    </View>
  );
};

export default AppLoadingSpinner;
