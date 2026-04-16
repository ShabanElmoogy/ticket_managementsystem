import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  isDark: boolean;
  onAddDoc: () => void;
}

/**
 * Web equivalent:
 *   "No documents yet" caption + outlined "New Doc" button
 */
const TreeEmpty: React.FC<Props> = ({ isDark, onAddDoc }) => {
  const textMuted = isDark ? '#64748b' : '#94a3b8';

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
        No documents yet
      </Text>
      <Pressable
        onPress={onAddDoc}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: 6, borderWidth: 1,
          borderColor: pressed ? '#2563eb' : '#3b82f6',
          backgroundColor: pressed ? '#eff6ff' : 'transparent',
        })}
      >
        <Text style={{ fontSize: 13, color: '#3b82f6', marginRight: 4 }}>+</Text>
        <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '600' }}>New Doc</Text>
      </Pressable>
    </View>
  );
};

export default TreeEmpty;
