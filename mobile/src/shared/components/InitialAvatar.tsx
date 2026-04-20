import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  name: string;
  size?: number;
  color?: string;       // accent color — used for background tint and text
}

/**
 * Circular avatar showing the first letter of a name.
 * Used in compact list rows, cards, user displays, etc.
 */
const InitialAvatar: React.FC<Props> = ({
  name, size = 32, color = '#3b82f6',
}) => (
  <View style={{
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: color + '20',
    alignItems: 'center', justifyContent: 'center',
  }}>
    <Text style={{
      fontSize: Math.round(size * 0.4),
      fontWeight: '700',
      color,
    }}>
      {name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

export default InitialAvatar;
