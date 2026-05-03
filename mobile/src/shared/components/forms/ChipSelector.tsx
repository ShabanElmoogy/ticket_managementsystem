/**
 * ChipSelector — labeled selector that renders options as rows or tiles.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUTS
 * ─────────────────────────────────────────────────────────────────────────────
 *   'rows'  (default) — full-width card rows via ChipRows
 *                       best for options with descriptions or preview badges
 *   'tiles'           — compact horizontal chips via ChipTiles
 *                       best for short labels without descriptions
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors() internally (for label color).
 * Do NOT use inside a <Modal> — screens only.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   CustomerForm    — maintenance type (rows layout with descriptions)
 *   DateFormatPanel — date format (rows layout with preview badges)
 *   PaginationSettingsPanel — pagination mode (rows layout)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   // Rows layout (default) — with description + preview
 *   <ChipSelector
 *     label="Maintenance Type"
 *     options={[
 *       { value: 'MONTHLY', label: 'Monthly', icon: '📅', description: 'Recurring billing' },
 *       { value: 'TRIAL',   label: 'Free Trial', icon: '🎁', description: 'Limited access' },
 *     ]}
 *     value={selected}
 *     onChange={setSelected}
 *   />
 *
 *   // Tiles layout — compact chips
 *   <ChipSelector
 *     label="Priority"
 *     layout="tiles"
 *     options={[
 *       { value: 'LOW',    label: 'Low',    color: '#10b981' },
 *       { value: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
 *       { value: 'HIGH',   label: 'High',   color: '#ef4444' },
 *     ]}
 *     value={priority}
 *     onChange={setPriority}
 *   />
 *
 *   // Last field in a form — remove bottom margin
 *   <ChipSelector ... style={{ marginBottom: 0 }} />
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import ChipRows  from './ChipRows';
import ChipTiles from './ChipTiles';
import type { ChipOption } from './ChipOption';

export interface ChipSelectorProps<T extends string = string> {
  options:   ChipOption<T>[];
  /** Currently selected value. Pass null for no selection. */
  value:     T | null;
  onChange:  (value: T) => void;
  /** Optional label rendered above the options */
  label?:    string;
  disabled?: boolean;
  /** 'rows' = full-width card rows (default) | 'tiles' = compact horizontal chips */
  layout?:   'rows' | 'tiles';
  /** Container style override — use to adjust spacing (e.g. marginBottom: 0 for last field) */
  style?:    ViewStyle;
}

function ChipSelector<T extends string = string>({
  options, value, onChange, label, disabled = false, layout = 'rows', style,
}: ChipSelectorProps<T>) {
  const c = useThemeColors();

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, { color: c.text.secondary }]}>
          {label}
        </Text>
      )}
      {layout === 'tiles'
        ? <ChipTiles options={options} value={value} onChange={onChange} disabled={disabled} />
        : <ChipRows  options={options} value={value} onChange={onChange} disabled={disabled} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize:      FontSize.sm,
    fontWeight:    FontWeight.semibold,
    marginBottom:  8,
    letterSpacing: 0.1,
  },
});

export default ChipSelector;
