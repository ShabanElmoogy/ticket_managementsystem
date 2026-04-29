import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { ChipOption } from './ChipOption';

export interface ChipTilesProps<T extends string = string> {
  options:   ChipOption<T>[];
  value:     T | null;
  onChange:  (value: T) => void;
  disabled?: boolean;
}

function ChipTiles<T extends string = string>({
  options, value, onChange, disabled = false,
}: ChipTilesProps<T>) {
  const c = useThemeColors();

  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map((opt) => {
        const active      = value === opt.value;
        const accentColor = opt.color ?? c.interactive.chipActiveBg;
        return (
          <Pressable
            key={opt.value}
            onPress={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled }}
            style={({ pressed }: { pressed: boolean }) => ({
              flex:            1,
              alignItems:      'center',
              paddingVertical: 8,
              borderRadius:    10,
              borderWidth:     1.5,
              opacity:         disabled ? 0.45 : 1,
              backgroundColor: active ? accentColor : pressed ? accentColor + '18' : c.surface.secondary,
              borderColor:     active ? accentColor : c.border.primary,
            })}
          >
            {opt.icon && <Text style={{ fontSize: 18, marginBottom: 2 }}>{opt.icon}</Text>}
            <Text style={{
              fontSize: 10, fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: 0.3,
              color: active ? '#fff' : c.text.muted,
            }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default ChipTiles;
