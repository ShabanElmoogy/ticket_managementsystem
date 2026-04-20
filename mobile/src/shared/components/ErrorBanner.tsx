import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  message: string;
  isDark: boolean;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Inline error banner with an optional retry button.
 * Reusable across any screen that needs to show an error with a retry action.
 */
const ErrorBanner: React.FC<Props> = ({
  message, isDark, onRetry, retryLabel = 'Retry',
}) => (
  <View style={{
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
    borderColor: isDark ? '#7f1d1d' : '#fecaca',
    backgroundColor: isDark ? '#3b1515' : '#fef2f2',
  }}>
    <Text style={{ fontSize: 16, marginRight: 8 }}>⚠️</Text>
    <Text style={{ flex: 1, fontSize: 12, color: isDark ? '#fca5a5' : '#b91c1c', lineHeight: 17 }}>
      {message}
    </Text>
    {onRetry && (
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => ({
          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, marginLeft: 8,
          backgroundColor: pressed ? '#dc2626' : '#ef4444',
        })}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{retryLabel}</Text>
      </Pressable>
    )}
  </View>
);

export default ErrorBanner;
