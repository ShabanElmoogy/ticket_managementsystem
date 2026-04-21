import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

export interface FilterChipOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  isDark: boolean;
  /** Label shown above the chip row. Hidden when omitted. */
  title?: string;
  /** Active chip accent color. Default purple. */
  activeColor?: string;
  keyExtractor?: (v: T) => string;
}

/**
 * Horizontal scrollable row of filter chips.
 * Generic — works with any value type (string, number, object).
 * Used for period selectors, status filters, category pickers, etc.
 */
function FilterChipGroup<T>({
  options, value, onChange, isDark,
  title, activeColor = '#8b5cf6',
  keyExtractor,
}: Props<T>) {
  const getKey = (v: T, i: number) =>
    keyExtractor ? keyExtractor(v) : String(i);

  return (
    <View style={{ marginTop: 8 }}>
      {title && (
        <Text style={{
          fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: 0.5, color: isDark ? '#475569' : '#94a3b8',
          marginBottom: 6,
        }}>
          {title}
        </Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: 6 }}
      >
        {options.map((opt, i) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={getKey(opt.value, i)}
              onPress={() => onChange(opt.value)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                backgroundColor: active ? activeColor : (isDark ? '#1e293b' : '#fff'),
                borderWidth: 1.5,
                borderColor: active ? activeColor : (isDark ? '#334155' : '#e2e8f0'),
              }}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: active ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
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
