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
 * Delegates to ChipRows / ChipTiles which call useThemeColors() internally.
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
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import ChipTitle from './ChipTitle';
import ChipRows  from './ChipRows';
import ChipTiles from './ChipTiles';
import type { ChipOption } from './ChipOption';

export interface ChipSelectorProps<T extends string = string> {
  options:   ChipOption<T>[];
  value:     T | null;
  onChange:  (value: T) => void;
  /** Optional label rendered above the options */
  label?:    string;
  disabled?: boolean;
  /** 'rows' = full-width card rows (default) | 'tiles' = compact horizontal chips */
  layout?:   'rows' | 'tiles';
}

function ChipSelector<T extends string = string>({
  options, value, onChange, label, disabled = false, layout = 'rows',
}: ChipSelectorProps<T>) {
  return (
    <View style={styles.wrapper}>
      {label && <ChipTitle title={label} />}
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
});

export default ChipSelector;
