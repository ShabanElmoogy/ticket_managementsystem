import React from 'react';
import { Pressable, Text } from 'react-native';

interface Props {
  onPress: () => void;
  children: React.ReactNode;
  color?: string;
  hoverBg?: string;
}

/**
 * Web equivalent: MUI IconButton size="small" sx={{ p: 0.25 }}
 * 24×24 tap target, transparent bg at rest, hoverBg on press.
 */
const IconBtn: React.FC<Props> = ({
  onPress, children, color = '#64748b', hoverBg = 'rgba(0,0,0,0.06)',
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={6}
    style={({ pressed }) => ({
      width: 24, height: 24, borderRadius: 4,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: pressed ? hoverBg : 'transparent',
    })}
  >
    <Text style={{ fontSize: 13, color, lineHeight: 16 }}>
      {children}
    </Text>
  </Pressable>
);

export default IconBtn;
