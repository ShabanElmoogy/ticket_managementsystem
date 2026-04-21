import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';

export interface ToggleButtonProps {
  /** Icon emoji or text */
  icon?: string;
  /** Button label */
  label: string;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** On press handler */
  onPress?: () => void;
  /** Custom container style */
  style?: ViewStyle;
}

/**
 * ToggleButton component - button with icon/text and loading state
 * Used for theme toggle, language toggle, etc.
 */
const ToggleButton: React.FC<ToggleButtonProps> = ({
  icon,
  label,
  backgroundColor = 'rgba(255,255,255,0.1)',
  textColor = '#fff',
  loading = false,
  disabled = false,
  onPress,
  style,
}) => {
  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && <Text style={{ fontSize: 14 }}>{icon}</Text>}
          <Text
            style={[
              styles.label,
              {
                color: textColor,
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ToggleButton;
