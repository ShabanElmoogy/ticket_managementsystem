import type { Ticket } from '../../../../services/api/types';

export interface TicketsTableProps {
  tickets: Ticket[];
  loading: boolean;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export interface DeleteDialogState {
  open: boolean;
  ticket: Ticket | null;
  loading: boolean;
}
