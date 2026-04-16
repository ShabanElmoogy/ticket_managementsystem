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
 * Maximized for mobile: 32×32 tap target, visible bg at rest, larger icon.
 */
const IconBtn: React.FC<Props> = ({
  onPress, children, color = '#64748b', hoverBg = 'rgba(0,0,0,0.06)',
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={4}
    style={({ pressed }) => ({
      width: 32, height: 32, borderRadius: 6,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: pressed ? hoverBg : 'rgba(0,0,0,0.04)',
      marginHorizontal: 1,
    })}
  >
    <Text style={{ fontSize: 16, color, lineHeight: 20, includeFontPadding: false }}>
      {children}
    </Text>
  </Pressable>
);

export default IconBtn;
