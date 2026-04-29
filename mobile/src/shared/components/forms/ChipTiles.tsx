/**
 * ChipTiles — compact horizontal chip selector.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DESIGN
 * ─────────────────────────────────────────────────────────────────────────────
 *   Renders options as equal-width pill chips in a horizontal row.
 *   Each chip shows an optional icon above a short uppercase label.
 *
 *   Active:   solid accent color bg + white text
 *   Inactive: surface.secondary bg + border.primary border + muted text
 *   Pressed:  tinted accent bg (13% opacity)
 *
 *   Supports per-option `color` override (from ChipOption.color).
 *   Falls back to `c.interactive.chipActiveBg` (blue) when no color set.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors() internally. Do NOT use inside a <Modal>.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   ChipSelector (layout="tiles")
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   <ChipTiles
 *     options={[
 *       { value: 'LOW',    label: 'Low',    icon: '🟢', color: '#10b981' },
 *       { value: 'MEDIUM', label: 'Medium', icon: '🟡', color: '#f59e0b' },
 *       { value: 'HIGH',   label: 'High',   icon: '🔴', color: '#ef4444' },
 *     ]}
 *     value={priority}
 *     onChange={setPriority}
 *   />
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
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
    <View style={styles.row}>
      {options.map((opt) => {
        const active  = value === opt.value;
        const accent  = opt.color ?? c.interactive.chipActiveBg;

        return (
          <Pressable
            key={opt.value}
            onPress={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled }}
            style={({ pressed }: { pressed: boolean }) => [
              styles.tile,
              {
                backgroundColor: active
                  ? accent
                  : pressed ? accent + '18' : c.surface.secondary,
                borderColor: active ? accent : c.border.primary,
                opacity:     disabled ? 0.45 : 1,
              },
            ]}
          >
            {opt.icon && (
              <Text style={styles.icon}>{opt.icon}</Text>
            )}
            <Text style={[
              styles.label,
              { color: active ? c.interactive.chipActiveText : c.text.muted },
            ]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
  tile: {
    flex:           1,
    alignItems:     'center',
    paddingVertical: 8,
    borderRadius:   Radius.lg,
    borderWidth:    1.5,
    minWidth:       60,   // prevents tiles from collapsing on many options
  },
  icon: {
    fontSize:     FontSize['2xl'],
    marginBottom: 2,
  },
  label: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

export default ChipTiles;
