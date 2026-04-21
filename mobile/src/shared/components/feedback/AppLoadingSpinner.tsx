import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export interface AppLoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

const AppLoadingSpinner: React.FC<AppLoadingSpinnerProps> = ({
  size = 'large',
  color = '#2563eb',
  message,
  fullScreen = false,
}) => (
  <View className={`items-center justify-center p-6 ${fullScreen ? 'flex-1' : ''}`}>
    <ActivityIndicator size={size} color={color} />
    {message && <Text className="mt-3 text-sm text-gray-500">{message}</Text>}
  </View>
);

export default AppLoadingSpinner;
