import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

interface Props {
  message:     string;
  onRetry?:    () => void;
  retryLabel?: string;
}

const ErrorBanner: React.FC<Props> = ({ message, onRetry, retryLabel = 'Retry' }) => {
  const c = useThemeColors();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginBottom: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: Radius.lg, borderWidth: 1,
      borderColor: c.intent.error + '66', backgroundColor: c.intent.errorSurface,
    }}>
      <Text style={{ fontSize: FontSize.xl, marginEnd: 8 }}>⚠️</Text>
      <Text style={{ flex: 1, fontSize: FontSize.sm, color: c.intent.error, lineHeight: 17 }}>{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: Radius.sm, marginStart: 8,
            backgroundColor: pressed ? c.interactive.errorPressed : c.interactive.error,
          })}
        >
          <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.text.inverse }}>
            {retryLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default ErrorBanner;
