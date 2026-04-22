import React from 'react';
import { Pressable, Text } from 'react-native';

interface Props {
  isDark:  boolean;
  onPress: () => void;
}

const ShareTrigger: React.FC<Props> = ({ isDark, onPress }) => {
  const surface   = isDark ? '#1e293b' : '#ffffff';
  const surfaceHi = isDark ? '#273549' : '#f8fafc';
  const border    = isDark ? '#475569' : '#d1d5db';
  const textPri   = isDark ? '#cbd5e1' : '#374151';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 18,
        minHeight: 58,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: border,
        backgroundColor: pressed ? surfaceHi : surface,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Text style={{ fontSize: 18 }}>📤</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: textPri, letterSpacing: 0.2 }}>
        Share
      </Text>
    </Pressable>
  );
};

export default ShareTrigger;
