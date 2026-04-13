// inputs
export { default as AppTextField, MyTextField } from './inputs/AppTextField';
export type { AppTextFieldProps } from './inputs/AppTextField';
export { default as MySelect, AppSelect } from './inputs/AppSelect';
export type { MySelectProps, AppSelectProps, SelectOption } from './inputs/AppSelect';

// buttons
export { default as AppButton } from './buttons/AppButton';
export type { AppButtonProps } from './buttons/AppButton';
export { default as AppMenuButton } from './buttons/AppMenuButton';
export type { AppMenuButtonProps } from './buttons/AppMenuButton';

// chips
export { default as AppChip } from './chips/AppChip';
export type { AppChipProps, ChipVariant } from './chips/AppChip';
export { default as AppFilterChip } from './chips/AppFilterChip';
export type { AppFilterChipProps } from './chips/AppFilterChip';

// dialogs
export { default as AppDeleteDialog } from './dialogs/AppDeleteDialog';
export type { AppDeleteDialogProps } from './dialogs/AppDeleteDialog';
export { default as AppConfirmDialog } from './dialogs/AppConfirmDialog';
export type { AppConfirmDialogProps } from './dialogs/AppConfirmDialog';

// data-display
export { default as AppDataGrid, buildActionsColumn, ActionsCell } from './data-display/AppDataGrid';
export type { AppDataGridProps, ActionColor, RowAction, ActionsCellProps } from './data-display/AppDataGrid';
export * from './data-display/AppGridCells';
export { default as MetricCard } from './data-display/MetricCard';
export type { MetricCardProps } from './data-display/MetricCard';
export { default as OverviewCard } from './data-display/OverviewCard';
export type { OverviewCardProps } from './data-display/OverviewCard';
export { default as StatCard } from './data-display/StatCard';
export { default as StatIcon } from './data-display/StatIcon';
export { default as StatProgress } from './data-display/StatProgress';
export { default as StatValue } from './data-display/StatValue';

// layout
export { default as AppGridHeader } from './layout/AppGridHeader';
export type { AppGridHeaderProps } from './layout/AppGridHeader';
export { default as AppPageHeader } from './layout/AppPageHeader';
export type { AppPageHeaderProps } from './layout/AppPageHeader';
export { default as AppDashboardHeader } from './layout/AppDashboardHeader';
export { default as AppScrollToTop } from './layout/AppScrollToTop';
export { default as AppLanguageSelector } from './layout/AppLanguageSelector';

// feedback
export { default as ErrorBoundary } from './feedback/ErrorBoundary';

// forms (already exists)
export * from './forms/ReusableFormDialog';

// Legacy aliases
export { default as AdminDataGrid } from './data-display/AppDataGrid';
export { default as AdminGridHeader } from './layout/AppPageHeader';
export { default as ScrollToTop } from './layout/AppScrollToTop';
export { default as LanguageSelector } from './layout/AppLanguageSelector';
export { default as DashboardHeader } from './layout/AppDashboardHeader';
export { default as MyChip } from './chips/AppChip';
export { default as MyGridHeader } from './layout/AppGridHeader';
export { default as MyMenuButton } from './buttons/AppMenuButton';
export { default as LoadingButton } from './buttons/AppButton';
export { default as FilterChip } from './chips/AppFilterChip';
export { default as ConfirmTextDialog } from './dialogs/AppConfirmDialog';
export { default as DeleteConfirmDialog } from './dialogs/AppDeleteDialog';
