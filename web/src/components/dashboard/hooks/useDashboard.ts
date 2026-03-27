import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { useAuthStore } from "../../../stores/authStore";
import { kanbanApi, ticketsApi, type Ticket, type CreateTicketData } from "../../../services/api";
import type { KanbanBoard } from "../../kanban/types/types";
import { 
  useTicketsQuery, 
  useUsersQuery, 
  useEmployeesQuery, 
  useCustomersQuery, 
  useApplicationsQuery,
  useCreateTicketMutation,
  useTakeTicketMutation,
  useUpdateTicketMutation,
  useAddCommentMutation,
  useDeleteTicketMutation,
} from "./useTicketsQuery";
import { useSocketQuery } from "../../../hooks/useSocketQuery";
import { useQueryClient } from "@tanstack/react-query";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
};

export type UseDashboardReturn = ReturnType<typeof useDashboard>;

export const useDashboard = () => {
  const { user, token } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xl"));
  const queryClient = useQueryClient();

  const [defaultBoard, setDefaultBoard] = useState<KanbanBoard | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | "">("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [deletedFilter, setDeletedFilter] = useState<'active' | 'deleted'>('active');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Debounce search input — fires API call 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // TanStack Query hooks
  const { data: rawTickets = [], isLoading: ticketsLoading } = useTicketsQuery({
    status: statusFilter,
    priority: priorityFilter,
    userFilter,
    customerFilter,
    applicationFilter,
    deletedFilter,
    search: debouncedSearch,
  });
  
  // Client-side overdue filter only (search is now backend-driven)
  const tickets = useMemo(() => {
    if (!overdueFilter) return rawTickets;
    const now = new Date();
    return rawTickets.filter((t) =>
      t.dueDate &&
      new Date(t.dueDate) < now &&
      !['RESOLVED', 'CLOSED'].includes(t.status)
    );
  }, [rawTickets, overdueFilter]);
  
  const { data: allUsers = [] } = useUsersQuery();
  const { data: employees = [] } = useEmployeesQuery();
  const { data: customers = [] } = useCustomersQuery();
  const { data: applications = [] } = useApplicationsQuery();
  
  const createTicketMutation = useCreateTicketMutation();
  const takeTicketMutation = useTakeTicketMutation();
  const updateTicketMutation = useUpdateTicketMutation();
  const addCommentMutation = useAddCommentMutation();
  const deleteTicketMutation = useDeleteTicketMutation();
  
  // Socket for real-time updates
  useSocketQuery();

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });

  const showSnackbar = (message: string, severity: SnackbarState["severity"]) => setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === "OPEN").length;
    const inProgressTickets = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED").length;
    const closedTickets = tickets.filter((t) => t.status === "CLOSED").length;
    return { totalTickets, openTickets, inProgressTickets, resolvedTickets, closedTickets };
  }, [tickets]);

  const getOrCreateDefaultBoard = async (): Promise<KanbanBoard | null> => {
    if (!token) return null;
    try {
      const boards = await kanbanApi.getAllBoards();
      let defaultBoard = boards.find((b) => b.isDefault) || boards[0];
      if (!defaultBoard) {
        defaultBoard = await kanbanApi.createBoard({ name: "Main Board", description: "Default board for all tickets", isDefault: true });
      }
      return defaultBoard;
    } catch (_error) {
      console.error("Error getting/creating default board:", _error);
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const defaultBoardData = await getOrCreateDefaultBoard();
      setDefaultBoard(defaultBoardData);
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error fetching data", "error");
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTicket = async (ticketData: CreateTicketData) => {
    try {
      const ticketWithBoard = { ...ticketData, boardId: defaultBoard?.id };
      await createTicketMutation.mutateAsync(ticketWithBoard);
      showSnackbar("Ticket posted successfully! 🎉", "success");
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error creating ticket", "error");
    }
  };

  const handleAddComment = async (ticketId: string, content: string) => {
    try {
      await addCommentMutation.mutateAsync({ ticketId, content });
      showSnackbar("Comment added successfully", "success");
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error adding comment", "error");
    }
  };

  const handleTakeTicket = async (ticketId: string) => {
    try {
      await takeTicketMutation.mutateAsync(ticketId);
      showSnackbar("Ticket assigned successfully", "success");
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error taking ticket", "error");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") => {
    try {
      await updateTicketMutation.mutateAsync({ id: ticketId, data: { status } });
      showSnackbar("Ticket updated successfully", "success");
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error updating ticket", "error");
    }
  };

  const handleBulkUpdateStatus = async (ids: string[], status: Ticket['status']) => {
    try {
      await ticketsApi.bulkUpdateStatus(ids, status);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showSnackbar(`${ids.length} ticket${ids.length > 1 ? 's' : ''} updated to ${status.replace('_', ' ')}`, 'success');
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : 'Error updating tickets', 'error');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
      showSnackbar("Ticket deleted", "success");
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error deleting ticket", "error");
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailsDialogOpen(true);
  };

  const activeFilters = useMemo(() => ({
    status: statusFilter,
    priority: priorityFilter,
    user: userFilter,
    customer: customerFilter,
    application: applicationFilter,
    deleted: deletedFilter,
    search: searchInput,
    overdue: overdueFilter,
  }), [statusFilter, priorityFilter, userFilter, customerFilter, applicationFilter, deletedFilter, searchInput, overdueFilter]);

  return {
    // env
    isMobile,
    user,
    userRole: user?.role,
    token,

    // state
    stats,
    tickets,
    employees,
    customers,
    applications,
    defaultBoard,
    loading: ticketsLoading,
    detailsDialogOpen,
    selectedTicket,
    statusFilter,
    priorityFilter,
    userFilter,
    customerFilter,
    applicationFilter,
    deletedFilter,
    overdueFilter,
    searchQuery: searchInput,
    showMobileSearch,
    allUsers,
    snackbar,

    // setters
    setDetailsDialogOpen,
    setSelectedTicket,
    setStatusFilter,
    setPriorityFilter,
    setUserFilter,
    setCustomerFilter,
    setApplicationFilter,
    setDeletedFilter,
    setOverdueFilter,
    setSearchQuery: setSearchInput,
    setShowMobileSearch,
    setSnackbar,

    // data ops
    fetchData,

    // handlers
    showSnackbar,
    handleCreateTicket,
    handleAddComment,
    handleTakeTicket,
    handleUpdateTicketStatus,
    handleBulkUpdateStatus,
    handleDeleteTicket,
    handleTicketClick,

    // ui helpers
    activeFilters,
    closeSnackbar,
  } as const;
};
