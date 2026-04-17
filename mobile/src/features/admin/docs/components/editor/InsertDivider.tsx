import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  isDark: boolean;
  onPress: () => void;
}

/**
 * Thin ＋ divider rendered between blocks.
 * Tapping it opens the MiniBlockPicker to insert a new block at that position.
 */
const InsertDivider: React.FC<Props> = ({ isDark, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginVertical: 2, paddingVertical: 3, paddingHorizontal: 4,
      opacity: pressed ? 1 : 0.35,
    })}
    hitSlop={6}
  >
    <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#334155' : '#e2e8f0' }} />
    <View style={{
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 14 }}>＋</Text>
    </View>
    <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#334155' : '#e2e8f0' }} />
  </Pressable>
);

export default InsertDivider;
