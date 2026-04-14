import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { ticketsKeys } from '../api/queryKeys';
import { usersApi } from '../../usersManagement/api/users';
import { useAuxData } from '../../../../shared/hooks/useAuxData';
import type { Ticket, CreateTicketData, User } from '../../../../services/api/types';
import type { SnackbarState, DeleteDialogState } from '../types/types';

export interface TicketsControllerReturn {
  tickets: Ticket[];
  users: User[];
  loading: boolean;
  dialogOpen: boolean;
  editingTicket: Ticket | null;
  snackbar: SnackbarState;
  deleteDialog: DeleteDialogState;
  handleOpenDialog: (ticket?: Ticket) => void;
  handleCloseDialog: () => void;
  handleCreateSubmit: (values: CreateTicketData) => Promise<void>;
  handleDeleteClick: (ticket: Ticket) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  handleSnackbarClose: () => void;
  refetch: () => void;
}

export function useTicketsManagement(): TicketsControllerReturn {
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [snackbar, setSnackbar]         = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, ticket: null, loading: false });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: tickets = [], isLoading: ticketsLoading, refetch } = useQuery({
    queryKey: ticketsKeys.all,
    queryFn: () => ticketsApi.getTickets(),
  });

  const { data: users = [], isLoading: usersLoading } = useAuxData<User[]>(
    ['admin-ticket-users'],
    () => usersApi.getTenantUsers(),
  );

  const loading = ticketsLoading || usersLoading;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: CreateTicketData) => ticketsApi.createTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketsKeys.all });
      showSnackbar('Ticket created successfully', 'success');
      setDialogOpen(false);
      setEditingTicket(null);
    },
    onError: (e: unknown) => showSnackbar(e instanceof Error ? e.message : 'Error creating ticket', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketsApi.deleteTicket(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketsKeys.all });
      showSnackbar('Ticket deleted successfully', 'success');
      setDeleteDialog({ open: false, ticket: null, loading: false });
    },
    onError: (e: unknown) => {
      showSnackbar(e instanceof Error ? e.message : 'Error deleting ticket', 'error');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenDialog  = useCallback((ticket?: Ticket) => { setEditingTicket(ticket ?? null); setDialogOpen(true); }, []);
  const handleCloseDialog = useCallback(() => { setDialogOpen(false); setEditingTicket(null); }, []);

  const handleCreateSubmit = useCallback(async (data: CreateTicketData) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const handleDeleteClick   = useCallback((ticket: Ticket) => setDeleteDialog({ open: true, ticket, loading: false }), []);
  const handleDeleteCancel  = useCallback(() => setDeleteDialog({ open: false, ticket: null, loading: false }), []);
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.ticket) return;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    await deleteMutation.mutateAsync(deleteDialog.ticket.id);
  }, [deleteDialog.ticket, deleteMutation]);

  const handleSnackbarClose = useCallback(() => setSnackbar((prev) => ({ ...prev, open: false })), []);

  return {
    tickets, users, loading,
    dialogOpen, editingTicket,
    snackbar, deleteDialog,
    handleOpenDialog, handleCloseDialog, handleCreateSubmit,
    handleDeleteClick, handleDeleteConfirm, handleDeleteCancel,
    handleSnackbarClose,
    refetch: () => { void refetch(); },
  };
}

export default useTicketsManagement;
