import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface AvatarProps {
  /** Text to display (will be converted to initials if longer than 2 chars) */
  text: string;
  /** Background color */
  backgroundColor?: string;
  /** Size in pixels */
  size?: number;
  /** Text color */
  textColor?: string;
  /** Font size (defaults to size/3) */
  fontSize?: number;
}

/**
 * Avatar component - displays initials in a colored circle
 * Used in header, drawer, and profile screens
 */
const Avatar: React.FC<AvatarProps> = ({
  text,
  backgroundColor = '#10b981',
  size = 32,
  textColor = '#fff',
  fontSize,
}) => {
  const getInitials = (str: string) =>
    str.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const initials = text.length > 2 ? getInitials(text) : text.toUpperCase();
  const computedFontSize = fontSize ?? Math.round(size / 3);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: computedFontSize,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
});

export default Avatar;
