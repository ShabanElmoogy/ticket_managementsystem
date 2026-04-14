import React from 'react';
import { View, Text } from 'react-native';
import AppButton from './AppButton';

export interface AppEmptyStateProps {
  icon?: string;
  message: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

const AppEmptyState: React.FC<AppEmptyStateProps> = ({ icon, message, subtitle, action }) => (
  <View className="flex-1 items-center justify-center p-8">
    {icon && <Text className="text-5xl mb-4">{icon}</Text>}
    <Text className="text-lg font-semibold text-gray-700 text-center mb-2">{message}</Text>
    {subtitle && <Text className="text-sm text-gray-400 text-center mb-4">{subtitle}</Text>}
    {action && (
      <AppButton variant="outlined" color="primary" onPress={action.onPress} style={{ marginTop: 8 }}>
        {action.label}
      </AppButton>
    )}
  </View>
);

export default AppEmptyState;
