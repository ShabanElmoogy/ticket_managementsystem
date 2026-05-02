/**
 * Shared UI components — grouped by concern.
 *
 * Subfolders:
 *   display/    — Avatar, Badge, StatCard, SectionHeader, etc.
 *   feedback/   — AppEmptyState, ErrorBoundary
 *   forms/      — AppTextInput, AppButton, AppSearchInput, AppBadge
 *   dialogs/    — ConfirmDeleteDialog, ForceDeleteConfirmDialog, AlertDialog
 *   navigation/ — NavItem, BottomNavItem, IconButton, ToggleButton
 *   layout/     — AppScreenHeader, ViewToggle, VerticalDivider, HeaderActionGroup
 *   data/       — AppDataTable, DataCard, CompactListRow, PaginatedView, FilterChipGroup
 *   actions/    — HeaderIconButton (add/export/refresh/neutral), DialogButton
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
