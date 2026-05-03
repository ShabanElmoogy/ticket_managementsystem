/**
 * ChipRows — full-width selectable rows with icon, label, description, and preview badge.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DESIGN
 * ─────────────────────────────────────────────────────────────────────────────
 *   Each option renders as a full-width card row:
 *     [icon]  [label]          [preview badge]  [✓]
 *             [description]
 *
 *   Active:   blue tinted bg + blue border + ✓ checkmark
 *   Inactive: surface.secondary bg + border.primary border
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors() internally. Do NOT use inside a <Modal>.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   ChipSelector (layout="rows") — default layout
 *   DateFormatPanel — date format selection
 *   CustomerForm — maintenance type selection
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   <ChipRows
 *     options={[
 *       { value: 'MONTHLY', label: 'Monthly', icon: '📅', description: 'Recurring billing', preview: '31 Dec 2025' },
 *       { value: 'TRIAL',   label: 'Free Trial', icon: '🎁', description: 'Limited access' },
 *     ]}
 *     value={selected}   // null = no selection
 *     onChange={setSelected}
 *   />
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import type { ChipOption } from './ChipOption';

// Hex alpha for ~9% opacity tint on active background
const ACTIVE_BG_ALPHA = '18';

export interface ChipRowsProps<T extends string = string> {
  options:   ChipOption<T>[];
  /** Currently selected value. Pass null for no selection. */
  value:     T | null;
  onChange:  (value: T) => void;
  disabled?: boolean;
}

function ChipRows<T extends string = string>({
  options, value, onChange, disabled = false,
}: ChipRowsProps<T>) {
  const c = useThemeColors();

  return (
    <View
      style={[styles.list, disabled && styles.listDisabled]}
      accessibilityRole="radiogroup"
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        const a11yLabel = opt.description
          ? `${opt.label}, ${opt.description}`
          : opt.label;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={a11yLabel}
            accessibilityState={{ selected: isActive, disabled }}
            style={[
              styles.row,
              {
                backgroundColor: isActive
                  ? c.interactive.chipActiveBg + ACTIVE_BG_ALPHA
                  : c.surface.secondary,
                borderColor: isActive
                  ? c.interactive.chipActiveBg
                  : c.border.primary,
              },
            ]}
          >
            {/* Left: icon + label + description */}
            <View style={styles.left}>
              {opt.icon && (
                <Text style={styles.icon} accessibilityElementsHidden>
                  {opt.icon}
                </Text>
              )}
              <View style={styles.labelWrap}>
                <Text style={[styles.label, { color: c.text.primary }]}>
                  {opt.label}
                </Text>
                {opt.description && (
                  <Text style={[styles.description, { color: c.text.muted }]}>
                    {opt.description}
                  </Text>
                )}
              </View>
            </View>

            {/* Right: preview badge + checkmark */}
            <View style={styles.right}>
              {opt.preview && (
                <View style={[
                  styles.previewBadge,
                  {
                    backgroundColor: isActive
                      ? c.interactive.chipActiveBg
                      : c.surface.tertiary,
                  },
                ]}>
                  <Text style={[
                    styles.previewText,
                    {
                      color: isActive
                        ? c.interactive.chipActiveText
                        : c.text.secondary,
                    },
                  ]}>
                    {opt.preview}
                  </Text>
                </View>
              )}
              {isActive && (
                <Text
                  style={[styles.check, { color: c.interactive.chipActiveBg }]}
                  accessibilityElementsHidden
                >
                  ✓
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  listDisabled: {
    opacity: 0.45,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        12,
    borderRadius:   Radius.lg,
    borderWidth:    2,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    flex:          1,
  },
  icon: {
    fontSize: 20,
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  description: {
    fontSize:  FontSize.xs,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  previewBadge: {
    borderRadius:      Radius.md,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  previewText: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.bold,
    // 'monospace' only works on Android; use a known cross-platform monospace font
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  check: {
    fontSize: FontSize.lg,
  },
});

export default ChipRows;
