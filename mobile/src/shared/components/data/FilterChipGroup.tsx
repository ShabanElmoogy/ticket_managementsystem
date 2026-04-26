import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface FilterChipOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options:        FilterChipOption<T>[];
  value:          T;
  onChange:       (v: T) => void;
  title?:         string;
  activeColor?:   string;
  keyExtractor?:  (v: T) => string;
}

function FilterChipGroup<T>({
  options, value, onChange,
  title, activeColor,
  keyExtractor,
}: Props<T>) {
  const c          = useThemeColors();
  const chipActive = activeColor ?? c.interactive.primary;
  const getKey     = (v: T, i: number) => keyExtractor ? keyExtractor(v) : String(i);

  return (
    <View style={{ marginTop: 8, marginStart: 10 }}>
      {title && (
        <Text style={{
          fontSize: FontSize.xs, fontWeight: FontWeight.bold,
          textTransform: 'uppercase', letterSpacing: 0.5,
          color: c.text.muted, marginBottom: 6,
        }}>
          {title}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
        {options.map((opt, i) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={getKey(opt.value, i)}
              onPress={() => onChange(opt.value)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
                backgroundColor: active ? chipActive : c.surface.primary,
                borderWidth: 1.5,
                borderColor: active ? chipActive : c.border.primary,
              }}
            >
              <Text style={{
                fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
                color: active ? c.text.inverse : c.text.secondary,
              }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default FilterChipGroup;
