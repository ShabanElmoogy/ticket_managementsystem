import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Radius, FontSize, FontWeight } from '../../../constants/theme';

export interface ToggleButtonProps {
  icon?:            string;
  label:            string;
  backgroundColor?: string;
  textColor?:       string;
  loading?:         boolean;
  disabled?:        boolean;
  onPress?:         () => void;
  style?:           ViewStyle;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  icon,
  label,
  backgroundColor = 'rgba(255,255,255,0.1)',
  textColor       = '#ffffff',
  loading         = false,
  disabled        = false,
  onPress,
  style,
}) => (
  <Pressable
    style={[styles.container, { backgroundColor, opacity: disabled ? 0.5 : 1 }, style]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator size="small" color={textColor} />
    ) : (
      <>
        {icon && <Text style={{ fontSize: FontSize.md }}>{icon}</Text>}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
    borderRadius:   Radius.md,
    paddingVertical: 8,
  },
  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});

export default ToggleButton;
