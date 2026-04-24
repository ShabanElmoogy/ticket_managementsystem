import React from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { useThemeColors, Palette, Radius, FontSize, FontWeight } from '@/src/constants/theme';

// Darken map — Palette is a plain object, safe at module level (no circular deps)
const DARKEN: Record<string, string> = {
  [Palette.red500]:    Palette.red600,
  [Palette.red600]:    Palette.red700,
  [Palette.blue500]:   Palette.blue600,
  [Palette.blue600]:   Palette.blue700,
  [Palette.amber500]:  Palette.amber600,
  [Palette.green500]:  Palette.green600,
  [Palette.violet500]: Palette.violet600,
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

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label, onPress, color, icon,
  disabled = false, flex = true, minHeight = 58,
}) => {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        ...(flex && { flex: 1 }),
        flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 10,
        borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center',
        minHeight,
        backgroundColor: pressed ? darken(color) : color,
        opacity: disabled ? 0.5 : 1,
        ...Platform.select({
          ios: {
            shadowColor:   color,
            shadowOffset:  { width: 0, height: pressed ? 1 : 3 },
            shadowOpacity: pressed ? 0.15 : 0.4,
            shadowRadius:  pressed ? 2 : 6,
          },
          android: { elevation: 0 },
        }),
      })}
    >
      {!!icon && (
        <Text style={{ fontSize: FontSize['2xl'], color: c.text.inverse, marginEnd: 8 }}>{icon}</Text>
      )}
      <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text.inverse, letterSpacing: 0.3 }}>
        {label}
      </Text>
    </Pressable>
  );
};

export default PrimaryButton;
