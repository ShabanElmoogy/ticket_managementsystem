import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

interface Props {
  onPress: () => void;
}

const InsertDivider: React.FC<Props> = ({ onPress }) => {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginVertical: 2, paddingVertical: 3, paddingHorizontal: 4,
        opacity: pressed ? 1 : 0.35,
      })}
      hitSlop={6}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: c.border.primary }} />
      <View style={{
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: c.surface.elevated,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 12, color: c.text.muted, lineHeight: 14 }}>＋</Text>
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: c.border.primary }} />
    </Pressable>
  );
};

export default InsertDivider;
