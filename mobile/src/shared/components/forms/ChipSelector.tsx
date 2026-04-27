/**
 * ChipSelector — same visual style as DateFormatPanel rows.
 * Full-width selectable rows: icon + label + description | preview badge + checkmark.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

export interface ChipOption<T extends string = string> {
  value:        T;
  label:        string;
  icon?:        string;
  description?: string;
  preview?:     string;
}

export interface ChipSelectorProps<T extends string = string> {
  options:   ChipOption<T>[];
  value:     T | null;
  onChange:  (value: T) => void;
  label?:    string;
  disabled?: boolean;
}

function ChipSelector<T extends string = string>({
  options, value, onChange, label, disabled = false,
}: ChipSelectorProps<T>) {
  const c = useThemeColors();

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.secondary, marginBottom: 8 }}>
          {label}
        </Text>
      )}

      <View style={{ gap: 8 }}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive, disabled }}
              style={{
                flexDirection:  'row',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        12,
                borderRadius:   10,
                backgroundColor: isActive ? '#3b82f618' : c.surface.secondary,
                borderWidth:    2,
                borderColor:    isActive ? '#3b82f6' : c.border.primary,
                opacity:        disabled ? 0.45 : 1,
              }}
            >
              {/* Left: icon + label + description */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                {opt.icon && (
                  <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                )}
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.primary }}>
                    {opt.label}
                  </Text>
                  {opt.description && (
                    <Text style={{ fontSize: 11, color: c.text.muted, marginTop: 2 }}>
                      {opt.description}
                    </Text>
                  )}
                </View>
              </View>

              {/* Right: preview badge + checkmark */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {opt.preview && (
                  <View style={{
                    backgroundColor: isActive ? '#3b82f6' : c.surface.tertiary,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      color: isActive ? '#fff' : c.text.secondary,
                    }}>
                      {opt.preview}
                    </Text>
                  </View>
                )}
                {isActive && (
                  <Text style={{ color: '#3b82f6', fontSize: 16 }}>✓</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default ChipSelector;
