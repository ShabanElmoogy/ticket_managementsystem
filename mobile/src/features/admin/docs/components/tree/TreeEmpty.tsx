import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

interface Props {
  onAddDoc: () => void;
}

/**
 * Web equivalent:
 *   "No documents yet" caption + outlined "New Doc" button
 */
const TreeEmpty: React.FC<Props> = ({ onAddDoc }) => {
  const c = useThemeColors();

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: c.text.muted, marginBottom: 10 }}>
        No documents yet
      </Text>
      <Pressable
        onPress={onAddDoc}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: 6, borderWidth: 1,
          borderColor: pressed ? c.buttons.primary.pressed : c.interactive.primary,
          backgroundColor: pressed ? c.interactive.primary + '18' : 'transparent',
        })}
      >
        <Text style={{ fontSize: 13, color: c.interactive.primary, marginRight: 4 }}>+</Text>
        <Text style={{ fontSize: 12, color: c.interactive.primary, fontWeight: '600' }}>New Doc</Text>
      </Pressable>
    </View>
  );
};

export default TreeEmpty;
