/**
 * AppScreenHeader
 *
 * Standard screen-level header used across all admin screens.
 *
 * Layout: [ViewToggle | leftActions] — [badge + subtitle] — [Refresh | Export | Add]
 *
 * Each section only renders when the relevant props are provided.
 *
 * @usedIn AdminCrudScreen, TicketsScreen, ReportsHeader
 * @variants
 *   - With ViewToggle: pass `view` + `onViewChange`
 *   - With custom left content: pass `leftActions`
 *   - With Add button: pass `onAdd`
 *   - With Export button: pass `onExport`
 *   - With Refresh button: pass `onRefresh`
 *
 * @modalSafety ❌ NOT Modal-safe — calls useTranslation() internally.
 *   Use only in screen-level components, never inside a <Modal> tree.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import ViewToggle from './ViewToggle';
import HeaderActionGroup from './HeaderActionGroup';
import type { AdminView } from '@/src/stores/uiStore';

export interface AppScreenHeaderProps {
  // ── Identity ──────────────────────────────────────────────────────────────
  subtitle?: string;
  badge?:    number | string;

  // ── View toggle (left side) ───────────────────────────────────────────────
  view?:          AdminView;
  onViewChange?:  (v: AdminView) => void;
  /** Custom left content — shown instead of ViewToggle when view/onViewChange absent */
  leftActions?:   React.ReactNode;

  // ── Add button ────────────────────────────────────────────────────────────
  onAdd?:    () => void;
  addLabel?: string;
  loading?:  boolean;

  // ── Export PDF ────────────────────────────────────────────────────────────
  onExport?:       () => void;
  exporting?:      boolean;
  exportDisabled?: boolean;
  exportLabel?:    string;
  exportingLabel?: string;

  // ── Refresh ───────────────────────────────────────────────────────────────
  onRefresh?:      () => void;
  refreshLabel?:   string;
  refreshingLabel?: string;

  // ── Escape hatch ──────────────────────────────────────────────────────────
  /** Extra buttons rendered before Refresh in the action group */
  rightActions?: React.ReactNode;
  style?:        ViewStyle;
}

/**
 * Standard screen header used across all admin screens.
 *
 * Layout: [ViewToggle | leftActions] — [Title + badge] — [Refresh | Export | | Add]
 *
 * Each section only renders when the relevant props are provided.
 */
const AppScreenHeader: React.FC<AppScreenHeaderProps> = ({
  subtitle,
  badge,
  view,
  onViewChange,
  leftActions,
  onAdd, 
  addLabel,
  loading = false,
  onExport, 
  exporting = false, 
  exportDisabled = false, 
  exportLabel, 
  exportingLabel,
  onRefresh, 
  refreshLabel, 
  refreshingLabel,
  rightActions,
  style,
}) => {
  const { t } = useTranslation();
  const c     = useThemeColors();

  return (
    <View style={[styles.container, style]}>

      {/* Left — ViewToggle or custom left actions */}
      <View style={styles.left}>
        {view && onViewChange
          ? <ViewToggle current={view} onChange={onViewChange} />
          : leftActions
        }
      </View>

      {/* Center — badge + subtitle */}
      {(badge !== undefined || subtitle) && (
        <View style={styles.center}>
          {badge !== undefined && (
            <View style={[styles.badge, {
              backgroundColor: c.interactive.primary + '22',
              borderColor:     c.interactive.primary + '44',
            }]}>
              <Text style={[styles.badgeText, { color: c.interactive.primary }]}>
                {badge}
              </Text>
            </View>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: c.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Right — Refresh | Export PDF | | Add */}
      <HeaderActionGroup
        loading={loading}
        onAdd={onAdd}
        addLabel={addLabel ?? t('common.add')}
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
};

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 12,
    paddingVertical:   12,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    minWidth:      80,
  },
  center: {
    flex:       1,
    alignItems: 'center',
  },
  badge: {
    borderWidth:       1,
    borderRadius:      999,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  badgeText: {
    fontSize:   12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize:  12,
    marginTop: 2,
  },
});

export default AppScreenHeader;
