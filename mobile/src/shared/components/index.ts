/**
 * Shared UI components — grouped by concern.
 *
 * Subfolders:
 *   display/    — Avatar, Badge, StatCard, MetricCard, SectionHeader, etc.
 *   feedback/   — AppLoadingSpinner, AppEmptyState
 *   forms/      — AppTextInput, AppButton, AppSearchInput, AppBadge
 *   dialogs/    — AppDeleteDialog, AppConfirmDialog
 *   navigation/ — NavItem, BottomNavItem, IconButton, ToggleButton
 *   layout/     — AppCard, AppScreenHeader, AdminToolbar, ViewToggle, VerticalDivider
 *   data/       — AppTable, DataCard, CompactListRow, PaginatedView, FilterChipGroup
 *   actions/    — RefreshButton, ExportPdfButton
 *   platform/   — HapticTab, IconSymbol
 *
 * All symbols are re-exported here so existing imports keep working:
 *   import { Avatar, AppButton } from '../../shared/components';
 */

export * from './display';
export * from './feedback';
export * from './forms';
export * from './dialogs';
export * from './navigation';
export * from './layout';
export * from './data';
export * from './actions';
export * from './platform';
