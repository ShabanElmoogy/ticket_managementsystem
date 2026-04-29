/**
 * ChipTitle — section label rendered above a ChipSelector.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors() internally. Do NOT use inside a <Modal>.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   ChipSelector — renders the optional `label` prop above the chips
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   <ChipTitle title="Maintenance Type" />
 *   <ChipTitle title="Priority" style={{ marginBottom: 12 }} />
 */

import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';

export interface ChipTitleProps {
  title:  string;
  /** Override text style — e.g. to adjust marginBottom */
  style?: TextStyle;
}

const ChipTitle: React.FC<ChipTitleProps> = ({ title, style }) => {
  const c = useThemeColors();
  return (
    <Text style={[styles.title, { color: c.text.secondary }, style]}>
      {title}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize:     FontSize.sm,
    fontWeight:   FontWeight.semibold,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
});

export default ChipTitle;
