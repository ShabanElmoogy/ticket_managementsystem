import React from 'react';
import { Pressable, Text } from 'react-native';

const DARKEN: Record<string, string> = {
  '#ef4444': '#dc2626', '#dc2626': '#b91c1c',
  '#3b82f6': '#2563eb', '#f59e0b': '#d97706',
  '#10b981': '#059669', '#8b5cf6': '#7c3aed',
};

function darken(hex: string): string {
  return DARKEN[hex] ?? hex;
}

export interface PrimaryButtonProps {
  label:      string;
  onPress:    () => void;
  color:      string;
  icon?:      string;
  disabled?:  boolean;
  flex?:      boolean;
  minHeight?: number;
}

/**
 * PrimaryButton — solid filled action button with press shadow + scale.
 *
 * Matches the visual style of AlertDialog's internal primary ActionButton
 * so it can be used inside `actionsOverride` alongside OutlineButton.
 *
 * @example
 * <PrimaryButton label="OK" icon="✓" color={accentColor} onPress={dismiss} />
 */
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  color,
  icon,
  disabled  = false,
  flex      = true,
  minHeight = 58,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => ({
      ...(flex && { flex: 1 }),
      flexDirection:  'row',
      paddingVertical: 18,
      paddingHorizontal: 10,
      borderRadius:   16,
      alignItems:     'center',
      justifyContent: 'center',
      gap:            8,
      minHeight,
      backgroundColor: pressed ? darken(color) : color,
      shadowColor:    color,
      shadowOffset:   { width: 0, height: pressed ? 1 : 4 },
      shadowOpacity:  pressed ? 0.1 : 0.35,
      shadowRadius:   pressed ? 2 : 8,
      elevation:      pressed ? 1 : 4,
      opacity:        disabled ? 0.5 : 1,
      transform:      [{ scale: pressed ? 0.97 : 1 }],
    })}
  >
    {!!icon && <Text style={{ fontSize: 18 }}>{icon}</Text>}
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>
      {label}
    </Text>
  </Pressable>
);

export default PrimaryButton;
