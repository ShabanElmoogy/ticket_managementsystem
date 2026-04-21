import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import ViewToggle from './ViewToggle';
import HeaderTitle from './HeaderTitle';
import HeaderActionGroup from './HeaderActionGroup';
import type { AdminView } from '../../../stores/uiStore';

export interface AppScreenHeaderProps {
  // ── Identity ──────────────────────────────────────────────────────────────
  title: string;
  subtitle?: string;
  badge?: number | string;
  isDark?: boolean;

  // ── View toggle (left side) ───────────────────────────────────────────────
  view?: AdminView;
  onViewChange?: (v: AdminView) => void;
  /** Any custom left content (shown instead of ViewToggle when no view/onViewChange) */
  leftActions?: React.ReactNode;

  // ── Add button ────────────────────────────────────────────────────────────
  onAdd?: () => void;
  addLabel?: string;
  loading?: boolean;

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

  // ── Legacy / escape hatch ─────────────────────────────────────────────────
  /** Extra buttons rendered before Refresh in the action group */
  rightActions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Standard screen header used across all admin screens.
 *
 * Layout: [ViewToggle | leftActions] — [Title + badge] — [Refresh | Export | | Add]
 *
 * Each section only renders when the relevant props are provided.
 */
const AppScreenHeader: React.FC<AppScreenHeaderProps> = ({
  isDark = false,
  view, onViewChange, leftActions,
  onAdd, addLabel = 'Add', loading = false,
  onExport, exporting = false, exportDisabled = false, exportLabel, exportingLabel,
  onRefresh, refreshLabel, refreshingLabel,
  rightActions, style,
}) => (
  <View style={[{ flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingHorizontal: 16, 
                  paddingVertical: 12 }, style]}>

    {/* Left — ViewToggle or custom left actions */}
    <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 80 }}>
      {view && onViewChange
        ? <ViewToggle current={view} onChange={onViewChange} isDark={isDark} />
        : leftActions
      }
    </View>

    {/* Right — Refresh | Export PDF | | Add */}
    <HeaderActionGroup
      isDark={isDark}
      loading={loading}
      onAdd={onAdd}
      addLabel={addLabel}
      onExport={onExport}
      exporting={exporting}
      exportDisabled={exportDisabled}
      exportLabel={exportLabel}
      exportingLabel={exportingLabel}
      onRefresh={onRefresh}
      refreshLabel={refreshLabel}
      refreshingLabel={refreshingLabel}
      extraActions={rightActions}
    />

  </View>
);

export default AppScreenHeader;
