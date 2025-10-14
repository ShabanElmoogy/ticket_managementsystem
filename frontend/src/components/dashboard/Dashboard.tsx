import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { useAuthStore } from "../../stores/authStore";
import {
  apiService,
  type Ticket,
  type DashboardStats,
  type User,
  type Customer,
  type Application,
} from "../../services/api";
import { kanbanApi } from "../../services/kanbanApi";
import type { KanbanBoard } from "../../types/kanban";
import Header from "./Header";
import StatsCards from "./StatsCards";
import CreateTicketPost from "../tickets/CreateTicketPost";
import TicketFeed from "../tickets/TicketFeed";
import TicketDetailsDialog from "../tickets/TicketDetailsDialog";
import ActivityFeed from "./ActivityFeed";
import AdminPanel from "../admin/AdminPanel";
import MobileFilters from "./MobileFilters";
import MobileTicketActions from "../tickets/MobileTicketActions";
import ScrollToTop from "../common/ScrollToTop";
import MobileSearchOverlay from "../tickets/MobileSearchOverlay";
import KanbanPage from "../kanban/KanbanPage";
import ErrorBoundary from "../common/ErrorBoundary";
import { io, Socket } from "socket.io-client";


type ViewType = 'dashboard' | 'kanban' | 'admin' ;

const Dashboard: React.FC = () => {
  const { user, token } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xl"));
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [defaultBoard, setDefaultBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  const getOrCreateDefaultBoard = async (): Promise<KanbanBoard | null> => {
    try {
      // Get all boards
      const boards = await kanbanApi.getAllBoards();
      
      // Look for a default board or the first available board
      let defaultBoard = boards.find(board => board.isDefault) || boards[0];
      
      // If no boards exist, create a default one
      if (!defaultBoard) {
        defaultBoard = await kanbanApi.createBoard({
          name: "Main Board",
          description: "Default board for all tickets",
          isDefault: true
        });
      }
      
      return defaultBoard;
    } catch (error) {
      console.error("Error getting/creating default board:", error);
      return null;
    }
  };

  const fetchInitialData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [
        ticketsData,
        employeesData,
        usersData,
        customersData,
        applicationsData,
        defaultBoardData,
      ] = await Promise.all([
        apiService.getTickets(token, {}), // Get all tickets initially
        user?.role === "ADMIN"
          ? apiService.getEmployees(token)
          : Promise.resolve([]),
        user?.role === "ADMIN"
          ? apiService.getUsers(token)
          : Promise.resolve([]),
        user?.role === "ADMIN"
          ? apiService.getCustomers(token)
          : Promise.resolve([]),
        user?.role === "ADMIN"
          ? apiService.getApplications(token)
          : Promise.resolve([]),
        getOrCreateDefaultBoard(),
      ]);

      // Calculate stats from all tickets initially
      const initialStats = calculateFilteredStats(ticketsData);
      setStats(initialStats);
      setTickets(ticketsData);
      setEmployees(employeesData);
      setAllUsers(usersData);
      setCustomers(customersData);
      setApplications(applicationsData);
      setDefaultBoard(defaultBoardData);
    } catch (error) {
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateFilteredStats = (tickets: Ticket[]) => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === "OPEN").length;
    const inProgressTickets = tickets.filter(
      (t) => t.status === "IN_PROGRESS"
    ).length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === "RESOLVED"
    ).length;

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
    };
  };

  const fetchTickets = async () => {
    if (!token) return;

    try {
      let ticketsData = await apiService.getTickets(token, {
        status: statusFilter,
        priority: priorityFilter,
      });

      // Filter by user if userFilter is set
      if (userFilter) {
        ticketsData = ticketsData.filter(
          (ticket) =>
            ticket.createdBy?.id === userFilter ||
            ticket.assignedTo?.id === userFilter
        );
      }

      // Filter by customer if customerFilter is set
      if (customerFilter) {
        ticketsData = ticketsData.filter(
          (ticket) => ticket.customer?.id === customerFilter
        );
      }

      // Filter by application if applicationFilter is set
      if (applicationFilter) {
        ticketsData = ticketsData.filter(
          (ticket) => ticket.application?.id === applicationFilter
        );
      }

      // Filter by search query if searchQuery is set
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        ticketsData = ticketsData.filter(
          (ticket) =>
            ticket.title.toLowerCase().includes(query) ||
            ticket.description.toLowerCase().includes(query) ||
            ticket.createdBy?.name.toLowerCase().includes(query) ||
            ticket.assignedTo?.name.toLowerCase().includes(query) ||
            ticket.customer?.name.toLowerCase().includes(query) ||
            ticket.application?.name.toLowerCase().includes(query) ||
            ticket.id.toLowerCase().includes(query)
        );
      }

      setTickets(ticketsData);

      // Update stats based on filtered tickets
      const filteredStats = calculateFilteredStats(ticketsData);
      setStats(filteredStats);
    } catch (error) {
      showSnackbar("Error fetching tickets", "error");
    }
  };

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [ticketsData, employeesData, usersData] = await Promise.all([
        apiService.getTickets(token, {
          status: statusFilter,
          priority: priorityFilter,
        }),
        user?.role === "ADMIN"
          ? apiService.getEmployees(token)
          : Promise.resolve([]),
        user?.role === "ADMIN"
          ? apiService.getUsers(token)
          : Promise.resolve([]),
      ]);

      // Filter by user if userFilter is set
      let filteredTickets = ticketsData;
      if (userFilter) {
        filteredTickets = filteredTickets.filter(
          (ticket) =>
            ticket.createdBy?.id === userFilter ||
            ticket.assignedTo?.id === userFilter
        );
      }

      // Filter by customer if customerFilter is set
      if (customerFilter) {
        filteredTickets = filteredTickets.filter(
          (ticket) => ticket.customer?.id === customerFilter
        );
      }

      // Filter by application if applicationFilter is set
      if (applicationFilter) {
        filteredTickets = filteredTickets.filter(
          (ticket) => ticket.application?.id === applicationFilter
        );
      }

      // Calculate stats from filtered tickets
      const filteredStats = calculateFilteredStats(filteredTickets);
      setStats(filteredStats);
      setTickets(filteredTickets);
      setEmployees(employeesData);
      setAllUsers(usersData);
    } catch (error) {
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, [token]);

  // Setup socket connection for realtime updates
  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Join user room for targeted notifications
    newSocket.emit("join", user.id);

    // Listen for ticket-related notifications
    newSocket.on("notification", (notification: any) => {
      const { type, data } = notification;

      // Handle different notification types
      switch (type) {
        case "TICKET_CREATED":
          // Refresh tickets when a new ticket is created
          if (token) {
            fetchTickets();
          }
          break;
        case "TICKET_UPDATED":
        case "TICKET_ASSIGNED":
          // Refresh tickets when tickets are updated or assigned
          if (token) {
            fetchTickets();
          }
          break;
        case "COMMENT_ADDED":
          // Refresh tickets to update comment counts
          if (token) {
            fetchTickets();
          }
          break;
        default:
          break;
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // Filter changes - only fetch tickets, don't show loading
  useEffect(() => {
    if (token && !loading) {
      fetchTickets();
    }
  }, [
    statusFilter,
    priorityFilter,
    userFilter,
    customerFilter,
    applicationFilter,
    searchQuery,
  ]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateTicket = async (ticketData: any) => {
    if (!token) return;

    try {
      // Add the default board ID to the ticket data
      const ticketWithBoard = {
        ...ticketData,
        boardId: defaultBoard?.id
      };
      
      await apiService.createTicket(token, ticketWithBoard);
      showSnackbar("Ticket posted successfully! 🎉", "success");
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error creating ticket",
        "error"
      );
    }
  };

  const handleAddComment = async (ticketId: string, content: string) => {
    if (!token) return;

    try {
      await apiService.addComment(token, ticketId, content);
      showSnackbar("Comment added successfully", "success");
      // Optionally refresh the specific ticket or all tickets
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error adding comment",
        "error"
      );
    }
  };

  const handleTakeTicket = async (ticketId: string) => {
    if (!token) return;

    try {
      await apiService.takeTicket(token, ticketId);
      showSnackbar("Ticket assigned successfully", "success");
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error taking ticket",
        "error"
      );
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    if (!token) return;

    try {
      await apiService.updateTicket(token, ticketId, { status } as any);
      showSnackbar("Ticket updated successfully", "success");
      fetchData();
      if (selectedTicket && selectedTicket.id === ticketId) {
        const updatedTicket = await apiService.getTicket(token, ticketId);
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error updating ticket",
        "error"
      );
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailsDialogOpen(true);
  };

  if (loading && tickets.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render different views based on currentView
  const renderCurrentView = () => {
    switch (currentView) {
      case 'kanban':
        return (
          <ErrorBoundary>
            <KanbanPage />
          </ErrorBoundary>
        );
      case 'admin':
        return <AdminPanel onBackToDashboard={() => setCurrentView('dashboard')} />;
      case 'dashboard':
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => (
    <Box>

      <Box
        sx={{
          p: { xs: 1, sm: 2, md: 3 },
          pt: { xs: 2, md: 4 },
        }}
      >
        {/* Main Content with Sidebar Layout */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {/* Main Content */}
          <Box sx={{ flex: 1, minWidth: 0, order: { xs: 2, lg: 1 } }}>
            <Container maxWidth={false} sx={{ p: 0, width: "100%" }}>
              {/* Stats Cards - Same width as other sections */}
              <StatsCards
                stats={stats}
                isFiltered={
                  !!(
                    statusFilter ||
                    priorityFilter ||
                    userFilter ||
                    customerFilter ||
                    applicationFilter ||
                    searchQuery
                  )
                }
                activeFilters={{
                  status: statusFilter,
                  priority: priorityFilter,
                  user: userFilter,
                  customer: customerFilter,
                  application: applicationFilter,
                  search: searchQuery,
                  userName: userFilter
                    ? allUsers.find((u) => u.id === userFilter)?.name
                    : undefined,
                  customerName: customerFilter
                    ? customers.find((c) => c.id === customerFilter)?.name
                    : undefined,
                  applicationName: applicationFilter
                    ? applications.find((a) => a.id === applicationFilter)?.name
                    : undefined,
                }}
              />

              {/* Create Ticket Post */}
              {user?.role === "ADMIN" && (
                <div data-testid="create-ticket">
                  <CreateTicketPost
                    onSubmit={handleCreateTicket}
                    employees={employees}
                    customers={customers}
                    applications={applications}
                  />
                </div>
              )}

              {/* Mobile-Optimized Filters */}
              {isMobile ? (
                <div data-testid="mobile-filters">
                  <MobileFilters
                    statusFilter={statusFilter}
                    priorityFilter={priorityFilter}
                    userFilter={userFilter}
                    customerFilter={customerFilter}
                    applicationFilter={applicationFilter}
                    searchQuery={searchQuery}
                    setStatusFilter={setStatusFilter}
                    setPriorityFilter={setPriorityFilter}
                    setUserFilter={setUserFilter}
                    setCustomerFilter={setCustomerFilter}
                    setApplicationFilter={setApplicationFilter}
                    setSearchQuery={setSearchQuery}
                    allUsers={allUsers}
                    customers={customers}
                    applications={applications}
                    tickets={tickets}
                    userRole={user?.role || ""}
                    loading={loading}
                    onRefresh={fetchData}
                  />
                </div>
              ) : (
                /* Desktop Filters */
                <Box
                  sx={{
                    mb: 3,
                    p: { xs: 1.5, sm: 2 },
                    backgroundColor: "background.paper",
                    borderRadius: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", lg: "row" },
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", lg: "center" },
                      gap: { xs: 2, lg: 0 },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        fontSize: {
                          xs: "1.1rem",
                          sm: "1.25rem",
                          md: "1.3rem",
                          lg: "1.35rem",
                        },
                        mb: { xs: 0.5, md: 0 },
                      }}
                    >
                      📋 Ticket Feed
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        gap: { xs: 1, sm: 1.5, md: 2 },
                        alignItems: "center",
                        flexWrap: "wrap",
                        width: { xs: "100%", lg: "auto" },
                        justifyContent: { xs: "flex-start", lg: "flex-end" },
                      }}
                    >
                      <FormControl
                        size="small"
                        sx={{
                          minWidth: { xs: 110, sm: 120 },
                          flex: {
                            xs: "1 1 calc(50% - 4px)",
                            md: "1 1 calc(33.333% - 8px)",
                            lg: "0 0 auto",
                          },
                        }}
                      >
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusFilter}
                          label="Status"
                          onChange={(e) => setStatusFilter(e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="OPEN">🔵 Open</MenuItem>
                          <MenuItem value="IN_PROGRESS">
                            🟡 In Progress
                          </MenuItem>
                          <MenuItem value="RESOLVED">🟢 Resolved</MenuItem>
                          <MenuItem value="CLOSED">⚫ Closed</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl
                        size="small"
                        sx={{
                          minWidth: { xs: 110, sm: 120 },
                          flex: {
                            xs: "1 1 calc(50% - 4px)",
                            md: "1 1 calc(33.333% - 8px)",
                            lg: "0 0 auto",
                          },
                        }}
                      >
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={priorityFilter}
                          label="Priority"
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="LOW">🟢 Low</MenuItem>
                          <MenuItem value="MEDIUM">🟡 Medium</MenuItem>
                          <MenuItem value="HIGH">��� High</MenuItem>
                          <MenuItem value="URGENT">🔴 Urgent</MenuItem>
                        </Select>
                      </FormControl>

                      {user?.role === "ADMIN" && allUsers.length > 0 && (
                        <FormControl
                          size="small"
                          sx={{
                            minWidth: { xs: 130, sm: 140 },
                            flex: {
                              xs: "1 1 calc(50% - 4px)",
                              md: "1 1 calc(33.333% - 8px)",
                              lg: "0 0 auto",
                            },
                          }}
                        >
                          <InputLabel>User</InputLabel>
                          <Select
                            value={userFilter}
                            label="User"
                            onChange={(e) => setUserFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="">All Users</MenuItem>
                            {allUsers.map((user) => (
                              <MenuItem key={user.id} value={user.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      backgroundColor:
                                        user.role === "ADMIN"
                                          ? "#ef4444"
                                          : "#10b981",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "0.7rem",
                                      color: "white",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {user.name.charAt(0)}
                                  </Box>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {user.name}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {user?.role === "ADMIN" && customers.length > 0 && (
                        <FormControl
                          size="small"
                          sx={{
                            minWidth: { xs: 130, sm: 140 },
                            flex: {
                              xs: "1 1 calc(50% - 4px)",
                              md: "1 1 calc(33.333% - 8px)",
                              lg: "0 0 auto",
                            },
                          }}
                        >
                          <InputLabel>Customer</InputLabel>
                          <Select
                            value={customerFilter}
                            label="Customer"
                            onChange={(e) => setCustomerFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="">All Customers</MenuItem>
                            {customers.map((customer) => (
                              <MenuItem key={customer.id} value={customer.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      backgroundColor: "#2563eb",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "0.7rem",
                                      color: "white",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {customer.name.charAt(0)}
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {customer.name}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {user?.role === "ADMIN" && applications.length > 0 && (
                        <FormControl
                          size="small"
                          sx={{
                            minWidth: { xs: 130, sm: 140 },
                            flex: {
                              xs: "1 1 calc(50% - 4px)",
                              md: "1 1 calc(33.333% - 8px)",
                              lg: "0 0 auto",
                            },
                          }}
                        >
                          <InputLabel>Application</InputLabel>
                          <Select
                            value={applicationFilter}
                            label="Application"
                            onChange={(e) =>
                              setApplicationFilter(e.target.value)
                            }
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="">All Applications</MenuItem>
                            {applications.map((app) => (
                              <MenuItem key={app.id} value={app.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      backgroundColor: "#059669",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "0.7rem",
                                      color: "white",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {app.name.charAt(0)}
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {app.name}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                        disabled={loading}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          minWidth: { xs: "100%", md: "auto" },
                          mt: { xs: 1, lg: 0 },
                          flex: { xs: "1 1 100%", lg: "0 0 auto" },
                        }}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Ticket Feed */}
              <TicketFeed
                tickets={tickets}
                onTicketClick={handleTicketClick}
                onTakeTicket={handleTakeTicket}
                onUpdateStatus={handleUpdateTicketStatus}
                onAddComment={handleAddComment}
              />
            </Container>
          </Box>

          {/* Activity Feed - Hidden on mobile */}
          <Box
            sx={{
              flexShrink: 0,
              order: { xs: 1, lg: 2 },
              width: { xs: "100%", lg: "auto" },
              maxHeight: { xs: "300px", lg: "none" },
              overflow: { xs: "hidden", lg: "visible" },
              display: { xs: "none", lg: "block" },
            }}
          >
            <ActivityFeed onTicketClick={handleTicketClick} />
          </Box>
        </Box>
      </Box>

      <TicketDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        ticket={selectedTicket}
        onUpdateStatus={handleUpdateTicketStatus}
        token={token || ""}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        open={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tickets={tickets}
        onTicketClick={handleTicketClick}
      />

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <MobileTicketActions
          onOpenFilters={() => {
            const filtersElement = document.querySelector(
              '[data-testid="mobile-filters"]'
            );
            if (filtersElement) {
              filtersElement.scrollIntoView({ behavior: "smooth" });
            }
          }}
          onRefresh={fetchData}
          onOpenSearch={() => setShowMobileSearch(true)}
          onOpenSort={() => {
            showSnackbar("Sort functionality coming soon!", "info");
          }}
          showCreateButton={user?.role === "ADMIN"}
          onCreateTicket={() => {
            const createElement = document.querySelector(
              '[data-testid="create-ticket"]'
            );
            if (createElement) {
              createElement.scrollIntoView({ behavior: "smooth" });
            }
          }}
        />
      )}

      {/* Desktop ScrollToTop Button */}
      {!isMobile && <ScrollToTop threshold={200} showProgress={true} />}
    </Box>
  );

  return (
    <Box>
      <Header
        onOpenAdminPanel={() => setCurrentView('admin')}
        onOpenKanban={() => setCurrentView('kanban')}
        onOpenWhatsApp={() => setCurrentView('whatsapp')}
        onOpenWhatsAppUsers={() => setCurrentView('whatsapp-users')}
        onTicketClick={handleTicketClick}
      />
      {renderCurrentView()}
    </Box>
  );
};

export default Dashboard;
