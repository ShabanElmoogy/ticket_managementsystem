import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../../../../stores/authStore";
import { apiService, type Ticket, type User, type CreateTicketData } from "../../../../services/api";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

export type DeleteDialogState = {
  open: boolean;
  ticket: Ticket | null;
  loading: boolean;
};

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
  refetch: () => Promise<void>;
}

export function useTicketsManagement(): TicketsControllerReturn {
  const { token } = useAuthStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, ticket: null, loading: false });

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [ticketsData, usersData] = await Promise.all([
        apiService.getTickets(token, {}),
        apiService.getUsers(token),
      ]);
      setTickets(ticketsData);
      setUsers(usersData);
    } catch (error) {
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  }, [token, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = useCallback((ticket?: Ticket) => {
    setEditingTicket(ticket || null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingTicket(null);
  }, []);

  const handleCreateSubmit = useCallback(async (data: CreateTicketData) => {
    if (!token) return;
    try {
      await apiService.createTicket(token, data);
      showSnackbar("Ticket created successfully", "success");
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error creating ticket", "error");
    }
  }, [token, fetchData, handleCloseDialog, showSnackbar]);

  const handleDeleteClick = useCallback((ticket: Ticket) => {
    setDeleteDialog({ open: true, ticket, loading: false });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteDialog.ticket) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await apiService.deleteTicket(token, deleteDialog.ticket.id);
      showSnackbar("Ticket deleted successfully", "success");
      setDeleteDialog({ open: false, ticket: null, loading: false });
      fetchData();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error deleting ticket", "error");
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [token, deleteDialog.ticket, fetchData, showSnackbar]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, ticket: null, loading: false });
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    tickets,
    users,
    loading,

    dialogOpen,
    editingTicket,

    snackbar,
    deleteDialog,

    handleOpenDialog,
    handleCloseDialog,
    handleCreateSubmit,

    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,

    handleSnackbarClose,
    refetch: fetchData,
  };
}

export default useTicketsManagement;
