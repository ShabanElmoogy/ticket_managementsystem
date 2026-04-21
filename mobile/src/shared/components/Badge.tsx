import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export interface BadgeProps {
  /** Badge text */
  label: string;
  /** Background color (with alpha for tint effect) */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Font size */
  fontSize?: number;
  /** Custom container style */
  style?: ViewStyle;
}

/**
 * Badge component - colored pill with text
 * Used for role badges, status indicators, etc.
 */
const Badge: React.FC<BadgeProps> = ({
  label,
  backgroundColor = 'rgba(16, 185, 129, 0.27)',
  textColor = '#fff',
  fontSize = 11,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontWeight: '500',
  },
});

export default Badge;
