import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import HeaderIconButton from '../actions/HeaderIconButton';
import VerticalDivider  from './VerticalDivider';

export interface HeaderActionGroupProps {
  loading?: boolean;

  // ── Add ──────────────────────────────────────────────────────────────────
  onAdd?:    () => void;
  addLabel?: string;

  // ── Export PDF ────────────────────────────────────────────────────────────
  onExport?:       () => void;
  exporting?:      boolean;
  exportDisabled?: boolean;
  exportLabel?:    string;
  exportingLabel?: string;

  // ── Refresh ───────────────────────────────────────────────────────────────
  onRefresh?:       () => void;
  refreshLabel?:    string;
  refreshingLabel?: string;

  /** Any extra buttons rendered before Refresh */
  extraActions?: React.ReactNode;
}

/**
 * Right-side action group for screen headers.
 *
 * Renders: [extraActions] [Refresh] [Export PDF] [|] [Add]
 * Each button only appears when its handler is provided.
 * A vertical divider is inserted between Add and the other buttons only when both are present.
 *
 * Usage locations: `AppScreenHeader`
 *
 * Variants / props:
 *   - onAdd / addLabel        — Add button (defaults label to t('common.add'))
 *   - onRefresh               — Refresh button with loading spinner
 *   - onExport / exporting    — Export PDF button with loading + disabled states
 *   - extraActions            — arbitrary ReactNode rendered before Refresh
 *
 * ⚠️ Modal safety: NOT safe inside <Modal> — calls useTranslation() internally.
 */
const HeaderActionGroup: React.FC<HeaderActionGroupProps> = ({
  loading = false,
  onAdd, addLabel,
  onExport, exporting = false, exportDisabled = false, exportLabel, exportingLabel,
  onRefresh, refreshLabel, refreshingLabel,
  extraActions,
}) => {
  const { t } = useTranslation();

  // Show divider only when Add coexists with other action buttons
  const hasOtherActions = !!(onRefresh || onExport);

  return (
    <View style={styles.container}>
      {extraActions}

      {onRefresh && (
        <HeaderIconButton
          variant="refresh"
          onPress={onRefresh}
          loading={loading}
          label={refreshLabel}
          loadingLabel={refreshingLabel}
        />
      )}

      {onExport && (
        <HeaderIconButton
          variant="export"
          onPress={onExport}
          loading={exporting}
          disabled={exportDisabled}
          label={exportLabel}
          loadingLabel={exportingLabel}
        />
      )}

      {onAdd && hasOtherActions && (
        <VerticalDivider height={36} marginHorizontal={2} />
      )}

      {onAdd && (
        <HeaderIconButton
          variant="add"
          onPress={onAdd}
          label={addLabel ?? t('common.add')}
          loading={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    justifyContent: 'flex-end',
    minWidth:       80,
  },
});

export default HeaderActionGroup;
