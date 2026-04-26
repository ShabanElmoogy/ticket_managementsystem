import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import AppButton from '@/src/shared/components/forms/AppButton';

export interface AppEmptyStateProps {
  icon?: string;
  message: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

const AppEmptyState: React.FC<AppEmptyStateProps> = ({ icon, message, subtitle, action }) => {
  const c = useThemeColors();
  
  return (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      {icon && (
        <Text style={{
          fontSize: 48,
          marginBottom: 16,
        }}>
          {icon}
        </Text>
      )}
      
      <Text style={{
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: c.text.primary,
        textAlign: 'center',
        marginBottom: 8,
      }}>
        {message}
      </Text>
      
      {subtitle && (
        <Text style={{
          fontSize: FontSize.sm,
          color: c.text.muted,
          textAlign: 'center',
          marginBottom: 16,
        }}>
          {subtitle}
        </Text>
      )}
      
      {action && (
        <AppButton
          variant="outlined"
          color="primary"
          onPress={action.onPress}
          style={{ marginTop: 8 }}
        >
          {action.label}
        </AppButton>
      )}
    </View>
  );
};

export default AppEmptyState;
