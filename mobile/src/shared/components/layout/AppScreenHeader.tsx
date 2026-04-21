import React from 'react';
import { View, Text, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import ViewToggle      from './ViewToggle';
import ExportPdfButton from '../actions/ExportPdfButton';
import RefreshButton   from '../actions/RefreshButton';
import VerticalDivider from './VerticalDivider';
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
  /** Legacy: any custom left content */
  leftActions?: React.ReactNode;

  // ── Add button (right side) ───────────────────────────────────────────────
  onAdd?: () => void;
  addLabel?: string;
  loading?: boolean;

  // ── Export PDF (right side, before Add) ──────────────────────────────────
  onExport?: () => void;
  exporting?: boolean;
  exportDisabled?: boolean;

  // ── Refresh (right side) ──────────────────────────────────────────────────
  onRefresh?: () => void;

  // ── Legacy ────────────────────────────────────────────────────────────────
  rightActions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AppScreenHeader: React.FC<AppScreenHeaderProps> = ({
  title, subtitle, badge, isDark = false,
  view, onViewChange, leftActions,
  onAdd, addLabel = 'Add', loading = false,
  onExport, exporting = false, exportDisabled = false,
  onRefresh,
  rightActions, style,
}) => (
  <View className="flex-row items-center px-4 py-3" style={style}>

    {/* Left — ViewToggle or custom left actions */}
    <View className="flex-row items-center" style={{ minWidth: 80 }}>
      {view && onViewChange
        ? <ViewToggle current={view} onChange={onViewChange} isDark={isDark} />
        : leftActions
      }
    </View>

    {/* Center — title + badge */}
    <View className="flex-1 items-center">
      <View className="flex-row items-center gap-1.5">
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
          {title}
        </Text>
        {badge !== undefined && (
          <View className="bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
            <Text className="text-xs font-semibold text-blue-600">{badge}</Text>
          </View>
        )}
      </View>
      {subtitle && (
        <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
      )}
    </View>

    {/* Right — Refresh | Export PDF | separator | Add */}
    <View className="flex-row items-center gap-2 justify-end" style={{ minWidth: 80 }}>
      {rightActions}

      {onRefresh && (
        <RefreshButton onPress={onRefresh} loading={loading} isDark={isDark} />
      )}

      {onExport && (
        <ExportPdfButton
          onPress={onExport}
          loading={exporting}
          disabled={exportDisabled}
          isDark={isDark}
        />
      )}

      {onAdd && (onExport || onRefresh) && (
        <VerticalDivider isDark={isDark} height={36} marginHorizontal={2} />
      )}

      {onAdd && (
        <Pressable
          onPress={onAdd}
          disabled={loading}
          style={({ pressed }) => ({
            alignItems: 'center', justifyContent: 'center', gap: 2,
            height: 44, paddingHorizontal: 12, borderRadius: 10,
            backgroundColor: pressed ? '#15803d' : '#16a34a',
            opacity: loading ? 0.5 : 1,
            shadowColor: '#16a34a',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: loading ? 0 : 0.35,
            shadowRadius: 5,
            elevation: loading ? 0 : 3,
          })}
        >
          <Text style={{ fontSize: 16, lineHeight: 18 }}>➕</Text>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>
            {addLabel}
          </Text>
        </Pressable>
      )}
    </View>

  </View>
);

export default AppScreenHeader;
