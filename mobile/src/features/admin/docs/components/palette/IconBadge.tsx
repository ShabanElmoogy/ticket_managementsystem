import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  icon: string;
  color: string;
  isEmoji?: boolean;
  size: number;
}

/**
 * Tinted square badge with an icon/emoji centered inside.
 * Used by both horizontal and vertical palette buttons.
 */
const IconBadge: React.FC<Props> = ({ icon, color, isEmoji, size }) => (
  <View style={{
    width: size, height: size,
    borderRadius: size * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color + '22',
    borderWidth: 1.5,
    borderColor: color + '55',
  }}>
    <Text style={{
      fontSize: isEmoji ? size * 0.5 : size * 0.44,
      fontWeight: isEmoji ? undefined : '800',
      color: isEmoji ? undefined : color,
      textAlign: 'center',
      lineHeight: size * 0.6,
      includeFontPadding: false,
    }}>
      {icon}
    </Text>
  </View>
);

export default IconBadge;
