import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontWeight } from '../../../constants/theme';

interface Props {
  name:   string;
  size?:  number;
  color?: string;
}

const InitialAvatar: React.FC<Props> = ({ name, size = 32, color }) => {
  const c           = useThemeColors();
  const accentColor = color ?? c.interactive.primary;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: accentColor + '20',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: Math.round(size * 0.4), fontWeight: FontWeight.bold, color: accentColor }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

export default InitialAvatar;
