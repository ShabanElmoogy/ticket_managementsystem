/**
 * FilterChipGroup — horizontal scrollable row of filter chips.
 *
 * Used for status/priority/type filters above data tables.
 *
 * @usedIn
 *   - `ReportTypeSelector` (reports feature) — report type filter
 *   - `ActivityPeriodSelector` (reports feature) — activity period filter
 *
 * @variants
 *   - Generic `<T>` — works with any value type (string, enum, etc.)
 *   - Optional `title` prop renders an uppercase label above the chips
 *   - Optional `activeColor` overrides the default primary blue for the active chip
 *   - Optional `keyExtractor` for non-string value types
 *
 * @modalSafety ❌ NOT Modal-safe — calls `useThemeColors()` internally.
 *   Do not render inside a `<Modal>`. Screens only.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface FilterChipOption<T> {
  value: T;
  label: string;
}

export interface FilterChipGroupProps<T> {
  options:       FilterChipOption<T>[];
  value:         T;
  onChange:      (v: T) => void;
  title?:        string;
  activeColor?:  string;
  /** Defaults to String(opt.value) */
  keyExtractor?: (v: T) => string;
}

function FilterChipGroup<T>({
  options, value, onChange,
  title, activeColor, keyExtractor,
}: FilterChipGroupProps<T>) {
  const c          = useThemeColors();
  const chipActive = activeColor ?? c.interactive.primary;
  const getKey     = (v: T) => keyExtractor ? keyExtractor(v) : String(v);

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: 6 }}
        accessibilityRole="radiogroup"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={getKey(opt.value)}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
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
