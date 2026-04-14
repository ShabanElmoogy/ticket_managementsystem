// Page
export { default as TicketsManagement } from './TicketsManagement';

// Components
export { default as TicketsTable } from './components/TicketsTable';
export { default as TicketsColumns, getTicketsColumns } from './components/TicketsColumns';

// API
export { ticketsApi } from './api/tickets';
export { ticketsKeys } from './api/queryKeys';

// Hooks
export { default as useTicketsManagement } from './hooks/useTicketsManagement';

// Types
export type {
  TicketsTableProps,
  SnackbarState,
  DeleteDialogState,
} from './types/types';
export type { TicketsControllerReturn } from './hooks/useTicketsManagement';
