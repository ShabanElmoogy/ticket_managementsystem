import React from 'react';
import { View } from 'react-native';
import HeaderIconButton from '../actions/HeaderIconButton';
import VerticalDivider  from './VerticalDivider';

export interface HeaderActionGroupProps {
  /** @deprecated — child components read theme internally via useThemeColors() */
  isDark?: boolean;
  loading?: boolean;

  // ── Add ──────────────────────────────────────────────────────────────────
  onAdd?: () => void;
  addLabel?: string;

  // ── Export PDF ────────────────────────────────────────────────────────────
  onExport?: () => void;
  exporting?: boolean;
  exportDisabled?: boolean;
  exportLabel?: string;
  exportingLabel?: string;

  // ── Refresh ───────────────────────────────────────────────────────────────
  onRefresh?: () => void;
  refreshLabel?: string;
  refreshingLabel?: string;

  /** Any extra buttons rendered before Refresh */
  extraActions?: React.ReactNode;
}

/**
 * Right-side action group for screen headers.
 * Renders: [extraActions] [Refresh] [Export PDF] [|] [Add]
 * Each button only appears when its handler is provided.
 */
const HeaderActionGroup: React.FC<HeaderActionGroupProps> = ({
  loading = false,
  onAdd, addLabel,
  onExport, exporting = false, exportDisabled = false, exportLabel, exportingLabel,
  onRefresh, refreshLabel, refreshingLabel,
  extraActions,
}) => {
  const hasActions = !!(onRefresh || onExport || extraActions);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 80 }}>
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

      {onAdd && hasActions && (
        <VerticalDivider height={36} marginHorizontal={2} />
      )}

      {onAdd && (
        <HeaderIconButton
          variant="add"
          onPress={onAdd}
          label={addLabel}
          loading={loading}
        />
      )}
    </View>
  );
};

export default HeaderActionGroup;
