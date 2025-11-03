import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../../../stores/authStore";
import { ticketsApi, usersApi, customersApi, applicationsApi, kanbanApi, type Ticket, type DashboardStats, type User, type Customer, type Application, type CreateTicketData } from "../../../services/api";
import type { KanbanBoard } from "../../../types/kanban";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
};

export type ViewType = "dashboard" | "kanban" | "admin" | "documents";

export type UseDashboardReturn = ReturnType<typeof useDashboard>;

type SocketNotification = {
  type: "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED";
};

export const useDashboard = () => {
  const { user, token } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xl"));

  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [stats, setStats] = useState<DashboardStats>({ totalTickets: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0 });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [defaultBoard, setDefaultBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | "">("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });

  const showSnackbar = (message: string, severity: SnackbarState["severity"]) => setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const calculateFilteredStats = (tickets: Ticket[]) => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === "OPEN").length;
    const inProgressTickets = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED").length;
    return { totalTickets, openTickets, inProgressTickets, resolvedTickets };
  };

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

  const fetchInitialData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [ticketsData, employeesData, usersData, customersData, applicationsData, defaultBoardData] = await Promise.all([
        ticketsApi.getTickets({}),
        user?.role === "ADMIN" ? usersApi.getEmployees() : Promise.resolve([]),
        user?.role === "ADMIN" ? usersApi.getUsers() : Promise.resolve([]),
        user?.role === "ADMIN" ? customersApi.getCustomers() : Promise.resolve([]),
        user?.role === "ADMIN" ? applicationsApi.getApplications() : Promise.resolve([]),
        getOrCreateDefaultBoard(),
      ]);
      const initialStats = calculateFilteredStats(ticketsData);
      setStats(initialStats);
      setTickets(ticketsData);
      setEmployees(employeesData);
      setAllUsers(usersData);
      setCustomers(customersData);
      setApplications(applicationsData);
      setDefaultBoard(defaultBoardData);
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    try {
      let ticketsData = await ticketsApi.getTickets({ status: statusFilter === "" ? undefined : statusFilter, priority: priorityFilter });
      if (userFilter) {
        ticketsData = ticketsData.filter((t) => t.createdBy?.id === userFilter || t.assignedTo?.id === userFilter);
      }
      if (customerFilter) {
        ticketsData = ticketsData.filter((t) => t.customer?.id === customerFilter);
      }
      if (applicationFilter) {
        ticketsData = ticketsData.filter((t) => t.application?.id === applicationFilter);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        ticketsData = ticketsData.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.createdBy?.name.toLowerCase().includes(q) ||
            t.assignedTo?.name.toLowerCase().includes(q) ||
            t.customer?.name.toLowerCase().includes(q) ||
            t.application?.name.toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q)
        );
      }
      setTickets(ticketsData);
      setStats(calculateFilteredStats(ticketsData));
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error fetching tickets", "error");
    }
  }, [token, statusFilter, priorityFilter, userFilter, customerFilter, applicationFilter, searchQuery]);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [ticketsData, employeesData, usersData] = await Promise.all([
        ticketsApi.getTickets({ status: statusFilter === "" ? undefined : statusFilter, priority: priorityFilter }),
        user?.role === "ADMIN" ? usersApi.getEmployees() : Promise.resolve([]),
        user?.role === "ADMIN" ? usersApi.getUsers() : Promise.resolve([]),
      ]);
      let filtered = ticketsData;
      if (userFilter) filtered = filtered.filter((t) => t.createdBy?.id === userFilter || t.assignedTo?.id === userFilter);
      if (customerFilter) filtered = filtered.filter((t) => t.customer?.id === customerFilter);
      if (applicationFilter) filtered = filtered.filter((t) => t.application?.id === applicationFilter);
      setStats(calculateFilteredStats(filtered));
      setTickets(filtered);
      setEmployees(employeesData);
      setAllUsers(usersData);
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Socket
  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
    const newSocket = io(socketUrl);
    setSocket(newSocket);
    newSocket.emit("join", user.id);
    newSocket.on("notification", (notification: SocketNotification) => {
      const { type } = notification;
      switch (type) {
        case "TICKET_CREATED":
        case "TICKET_UPDATED":
        case "TICKET_ASSIGNED":
        case "COMMENT_ADDED":
          if (token) fetchTickets();
          break;
        default:
          break;
      }
    });
    return () => {
      newSocket.disconnect();
    };
  }, [user, token, fetchTickets]);

  // Filters change effect
  useEffect(() => {
    if (token && !loading) fetchTickets();
  }, [token, loading, fetchTickets]);

  const handleCreateTicket = async (ticketData: CreateTicketData) => {
    if (!token) return;
    try {
      const ticketWithBoard = { ...ticketData, boardId: defaultBoard?.id };
      await ticketsApi.createTicket(ticketWithBoard);
      showSnackbar("Ticket posted successfully! 🎉", "success");
      fetchData();
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error creating ticket", "error");
    }
  };

  const handleAddComment = async (ticketId: string, content: string) => {
    if (!token) return;
    try {
      await ticketsApi.addComment(ticketId, content);
      showSnackbar("Comment added successfully", "success");
      fetchData();
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error adding comment", "error");
    }
  };

  const handleTakeTicket = async (ticketId: string) => {
    if (!token) return;
    try {
      await ticketsApi.takeTicket(ticketId);
      showSnackbar("Ticket assigned successfully", "success");
      fetchData();
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error taking ticket", "error");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") => {
    if (!token) return;
    try {
      await ticketsApi.updateTicket(ticketId, { status });
      showSnackbar("Ticket updated successfully", "success");
      fetchData();
    } catch (_error) {
      showSnackbar(_error instanceof Error ? _error.message : "Error updating ticket", "error");
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
    search: searchQuery,
  }), [statusFilter, priorityFilter, userFilter, customerFilter, applicationFilter, searchQuery]);

  return {
    // view
    currentView,
    setCurrentView,

    // env
    isMobile,
    user,
    token,

    // state
    stats,
    tickets,
    employees,
    customers,
    applications,
    defaultBoard,
    loading,
    detailsDialogOpen,
    selectedTicket,
    statusFilter,
    priorityFilter,
    userFilter,
    customerFilter,
    applicationFilter,
    searchQuery,
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
    setSearchQuery,
    setShowMobileSearch,
    setSnackbar,

    // data ops
    fetchData,
    fetchTickets,

    // handlers
    showSnackbar,
    handleCreateTicket,
    handleAddComment,
    handleTakeTicket,
    handleUpdateTicketStatus,
    handleTicketClick,

    // ui helpers
    activeFilters,
    closeSnackbar,
  } as const;
};
