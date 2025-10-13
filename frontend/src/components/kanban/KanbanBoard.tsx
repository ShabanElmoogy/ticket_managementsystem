import React, { useEffect, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Badge,
  Typography,
  alpha,
  Card,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
} from "@mui/material";
import {
  ViewColumn as ViewColumnIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Archive as ArchiveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  GridView as GridViewIcon,
  ViewCarousel as ViewCarouselIcon,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { isAfter, isBefore, parseISO } from "date-fns";
import { useKanbanStore } from "../../stores/kanbanStore";
import type {
  KanbanColumn as KanbanColumnType,
  KanbanTicket,
  TicketStatus,
} from "../../types/kanban";
import KanbanColumn from "./KanbanColumn";
import CreateTicketDialog from "./CreateTicketDialog";
import BoardSettingsDialog from "./BoardSettingsDialog";
import BoardAnalyticsDialog from "./BoardAnalyticsDialog";
import CreateBoardDialog from "./CreateBoardDialog";

// Import the modular board components
import {
  BoardHeader,
  BoardControls,
  BoardStats,
  BoardFilters,
  BoardMenu,
} from "./board";

interface KanbanBoardProps {
  boardId: string;
  boards: any[];
  selectedBoardId: string;
  setSelectedBoardId: (id: string) => void;
  handleBoardChange: (id: string) => void;
  handleCreateBoard: () => void;
  createBoardOpen: boolean;
  setCreateBoardOpen: (open: boolean) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  boards,
  selectedBoardId,
  handleBoardChange,
  handleCreateBoard,
  createBoardOpen,
  setCreateBoardOpen,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { currentBoard, loading, error, fetchBoard, moveTicket, clearError } =
    useKanbanStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Mobile-specific states
  const [activeTab, setActiveTab] = useState(0);
  const [mobileViewMode, setMobileViewMode] = useState<"tabs" | "swipe">(
    "tabs"
  );
  const [columnsDrawerOpen, setColumnsDrawerOpen] = useState(false);

  // Filter states
  const [dueDateFrom, setDueDateFrom] = useState<Date | null>(null);
  const [dueDateTo, setDueDateTo] = useState<Date | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [applicationFilter, setApplicationFilter] = useState<string>("");
  const [createdByFilter, setCreatedByFilter] = useState<string>("");
  const [estimatedHoursFilter, setEstimatedHoursFilter] = useState<string>("");
  const [estimatedHoursMin, setEstimatedHoursMin] = useState<number | "">("");
  const [estimatedHoursMax, setEstimatedHoursMax] = useState<number | "">("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId.replace(
      "column-",
      ""
    ) as TicketStatus;

    try {
      await moveTicket(draggableId, newStatus, destination.index, boardId);
    } catch (error) {
      console.error("Failed to move ticket:", error);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    fetchBoard(boardId);
    handleMenuClose();
  };

  // Mobile navigation helpers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSwipeNavigation = (direction: "prev" | "next") => {
    if (direction === "next" && activeTab < statusColumns.length - 1) {
      setActiveTab(activeTab + 1);
    } else if (direction === "prev" && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // Get column icons and colors
  const getColumnIcon = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return <DashboardIcon />;
      case "IN_PROGRESS":
        return <AssignmentIcon />;
      case "RESOLVED":
        return <CheckCircleIcon />;
      case "CLOSED":
        return <ArchiveIcon />;
      default:
        return <DashboardIcon />;
    }
  };

  const getColumnColor = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return theme.palette.info.main;
      case "IN_PROGRESS":
        return theme.palette.warning.main;
      case "RESOLVED":
        return theme.palette.success.main;
      case "CLOSED":
        return theme.palette.grey[500];
      default:
        return theme.palette.primary.main;
    }
  };

  const getTicketsForColumn = (status: TicketStatus): KanbanTicket[] => {
    if (!currentBoard) return [];

    return currentBoard.tickets
      .filter((ticket) => {
        if (ticket.status !== status) return false;

        if (searchFilter) {
          const searchTerm = searchFilter.toLowerCase();
          const matchesSearch =
            ticket.title.toLowerCase().includes(searchTerm) ||
            ticket.description.toLowerCase().includes(searchTerm) ||
            ticket.id.toLowerCase().includes(searchTerm) ||
            ticket.assignedTo?.name.toLowerCase().includes(searchTerm) ||
            ticket.createdBy?.name.toLowerCase().includes(searchTerm) ||
            ticket.customer?.name.toLowerCase().includes(searchTerm) ||
            ticket.application?.name.toLowerCase().includes(searchTerm);

          if (!matchesSearch) return false;
        }

        if (dueDateFrom || dueDateTo) {
          if (!ticket.dueDate) return false;
          const ticketDueDate = parseISO(ticket.dueDate);
          if (dueDateFrom && isBefore(ticketDueDate, dueDateFrom)) return false;
          if (dueDateTo && isAfter(ticketDueDate, dueDateTo)) return false;
        }

        if (priorityFilter && ticket.priority !== priorityFilter) return false;

        if (assigneeFilter) {
          if (assigneeFilter === "unassigned" && ticket.assignedTo)
            return false;
          if (
            assigneeFilter !== "unassigned" &&
            ticket.assignedTo?.id !== assigneeFilter
          )
            return false;
        }

        if (customerFilter) {
          if (customerFilter === "no-customer" && ticket.customer) return false;
          if (
            customerFilter !== "no-customer" &&
            ticket.customer?.id !== customerFilter
          )
            return false;
        }

        if (applicationFilter) {
          if (applicationFilter === "no-application" && ticket.application)
            return false;
          if (
            applicationFilter !== "no-application" &&
            ticket.application?.id !== applicationFilter
          )
            return false;
        }

        if (createdByFilter && ticket.createdBy?.id !== createdByFilter)
          return false;

        if (estimatedHoursFilter) {
          switch (estimatedHoursFilter) {
            case "no-estimate":
              if (ticket.estimatedHours) return false;
              break;
            case "has-estimate":
              if (!ticket.estimatedHours) return false;
              break;
            case "under-5":
              if (!ticket.estimatedHours || ticket.estimatedHours >= 5)
                return false;
              break;
            case "5-to-20":
              if (
                !ticket.estimatedHours ||
                ticket.estimatedHours < 5 ||
                ticket.estimatedHours > 20
              )
                return false;
              break;
            case "over-20":
              if (!ticket.estimatedHours || ticket.estimatedHours <= 20)
                return false;
              break;
          }
        }

        if (estimatedHoursMin !== "" || estimatedHoursMax !== "") {
          const hours = ticket.estimatedHours || 0;
          if (estimatedHoursMin !== "" && hours < estimatedHoursMin)
            return false;
          if (estimatedHoursMax !== "" && hours > estimatedHoursMax)
            return false;
        }

        return true;
      })
      .sort((a, b) => a.position - b.position);
  };

  const clearFilters = () => {
    setDueDateFrom(null);
    setDueDateTo(null);
    setPriorityFilter("");
    setAssigneeFilter("");
    setCustomerFilter("");
    setApplicationFilter("");
    setCreatedByFilter("");
    setEstimatedHoursFilter("");
    setEstimatedHoursMin("");
    setEstimatedHoursMax("");
    setSearchFilter("");
  };

  const hasActiveFilters = Boolean(
    dueDateFrom ||
      dueDateTo ||
      priorityFilter ||
      assigneeFilter ||
      customerFilter ||
      applicationFilter ||
      createdByFilter ||
      estimatedHoursFilter ||
      estimatedHoursMin !== "" ||
      estimatedHoursMax !== "" ||
      searchFilter
  );

  const getUniqueAssignees = () => {
    if (!currentBoard) return [];
    const assignees = new Map();
    currentBoard.tickets.forEach((ticket) => {
      if (ticket.assignedTo) {
        assignees.set(ticket.assignedTo.id, ticket.assignedTo);
      }
    });
    return Array.from(assignees.values());
  };

  const getUniqueCustomers = () => {
    if (!currentBoard) return [];
    const customers = new Map();
    currentBoard.tickets.forEach((ticket) => {
      if (ticket.customer) {
        customers.set(ticket.customer.id, ticket.customer);
      }
    });
    return Array.from(customers.values());
  };

  const getUniqueApplications = () => {
    if (!currentBoard) return [];
    const applications = new Map();
    currentBoard.tickets.forEach((ticket) => {
      if (ticket.application) {
        applications.set(ticket.application.id, ticket.application);
      }
    });
    return Array.from(applications.values());
  };

  const getUniqueCreators = () => {
    if (!currentBoard) return [];
    const creators = new Map();
    currentBoard.tickets.forEach((ticket) => {
      if (ticket.createdBy) {
        creators.set(ticket.createdBy.id, ticket.createdBy);
      }
    });
    return Array.from(creators.values());
  };

  const getColumnByStatus = (
    status: TicketStatus
  ): KanbanColumnType | undefined => {
    if (!currentBoard) return undefined;
    return currentBoard.columns.find(
      (col) =>
        col.name.toUpperCase().replace(/\s+/g, "_") === status ||
        (status === "OPEN" && col.name.toLowerCase().includes("todo")) ||
        (status === "IN_PROGRESS" &&
          col.name.toLowerCase().includes("progress")) ||
        (status === "RESOLVED" && col.name.toLowerCase().includes("review")) ||
        (status === "CLOSED" && col.name.toLowerCase().includes("done"))
    );
  };

  if (loading && !currentBoard) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={clearError}>
            Dismiss
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!currentBoard) {
    return (
      <Alert severity="info">
        Board not found or you don't have access to it.
      </Alert>
    );
  }

  const statusColumns: TicketStatus[] = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
  ];

  // Mobile Columns Navigation Component
  const MobileColumnsNavigation = () => (
    <Card
      elevation={0}
      sx={{
        mb: 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: "blur(10px)",
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Box sx={{ p: 1 }}>
        {/* View Mode Toggle */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.75rem" }}
          >
            Columns ({statusColumns.length})
          </Typography>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Tab View">
              <IconButton
                size="small"
                onClick={() => setMobileViewMode("tabs")}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor:
                    mobileViewMode === "tabs"
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                  color:
                    mobileViewMode === "tabs"
                      ? theme.palette.primary.main
                      : "text.secondary",
                }}
              >
                <ViewColumnIcon sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Swipe View">
              <IconButton
                size="small"
                onClick={() => setMobileViewMode("swipe")}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor:
                    mobileViewMode === "swipe"
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                  color:
                    mobileViewMode === "swipe"
                      ? theme.palette.primary.main
                      : "text.secondary",
                }}
              >
                <ViewCarouselIcon sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="All Columns">
              <IconButton
                size="small"
                onClick={() => setColumnsDrawerOpen(true)}
                sx={{ width: 32, height: 32 }}
              >
                <GridViewIcon sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: "auto",
            "& .MuiTab-root": {
              minHeight: "auto",
              py: 1,
              px: 2,
              fontSize: "0.75rem",
              textTransform: "none",
              minWidth: "auto",
            },
            "& .MuiTabs-indicator": {
              height: 2,
            },
          }}
        >
          {statusColumns.map((status, index) => {
            const column = getColumnByStatus(status);
            const tickets = getTicketsForColumn(status);
            const color = getColumnColor(status);

            return (
              <Tab
                key={status}
                icon={
                  <Badge
                    badgeContent={tickets.length}
                    color="primary"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.65rem",
                        minWidth: 16,
                        height: 16,
                      },
                    }}
                  >
                    {React.cloneElement(getColumnIcon(status), {
                      sx: { fontSize: "1rem", color },
                    })}
                  </Badge>
                }
                label={column?.name || status}
                iconPosition="start"
                sx={{
                  "&.Mui-selected": {
                    color: color,
                  },
                }}
              />
            );
          })}
        </Tabs>

        {/* Swipe Navigation Controls */}
        {mobileViewMode === "swipe" && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mt={1}
          >
            <IconButton
              size="small"
              onClick={() => handleSwipeNavigation("prev")}
              disabled={activeTab === 0}
              sx={{
                width: 36,
                height: 36,
                backgroundColor: alpha(theme.palette.action.hover, 0.1),
              }}
            >
              <ArrowBackIcon sx={{ fontSize: "1rem" }} />
            </IconButton>

            <Typography variant="caption" color="text.secondary">
              {activeTab + 1} of {statusColumns.length}
            </Typography>

            <IconButton
              size="small"
              onClick={() => handleSwipeNavigation("next")}
              disabled={activeTab === statusColumns.length - 1}
              sx={{
                width: 36,
                height: 36,
                backgroundColor: alpha(theme.palette.action.hover, 0.1),
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: "1rem" }} />
            </IconButton>
          </Stack>
        )}
      </Box>
    </Card>
  );

  // Columns Drawer for Overview
  const ColumnsDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={columnsDrawerOpen}
      onClose={() => setColumnsDrawerOpen(false)}
      onOpen={() => setColumnsDrawerOpen(true)}
      sx={{
        "& .MuiDrawer-paper": {
          borderRadius: "16px 16px 0 0",
          maxHeight: "80vh",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          All Columns
        </Typography>
        <List>
          {statusColumns.map((status, index) => {
            const column = getColumnByStatus(status);
            const tickets = getTicketsForColumn(status);
            const color = getColumnColor(status);

            return (
              <ListItem
                key={status}
                button
                onClick={() => {
                  setActiveTab(index);
                  setColumnsDrawerOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  backgroundColor:
                    index === activeTab ? alpha(color, 0.1) : "transparent",
                }}
              >
                <ListItemIcon>
                  <Badge badgeContent={tickets.length} color="primary">
                    {React.cloneElement(getColumnIcon(status), {
                      sx: { color },
                    })}
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={column?.name || status}
                  secondary={`${tickets.length} items`}
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Board Header */}
        <BoardHeader currentBoard={currentBoard}>
          <BoardControls
            boards={boards}
            selectedBoardId={selectedBoardId}
            currentBoard={currentBoard}
            hasActiveFilters={hasActiveFilters}
            onBoardChange={handleBoardChange}
            onCreateBoard={handleCreateBoard}
            onCreateTicket={() => setCreateTicketOpen(true)}
            onToggleFilters={() => setFiltersOpen(!filtersOpen)}
            onMenuClick={handleMenuClick}
          />

          {!isMobile && (
            <BoardStats
              statusColumns={statusColumns}
              getTicketsForColumn={getTicketsForColumn}
              getColumnByStatus={getColumnByStatus}
              hasActiveFilters={hasActiveFilters}
            />
          )}

          <BoardFilters
            filtersOpen={filtersOpen}
            hasActiveFilters={hasActiveFilters}
            searchFilter={searchFilter}
            dueDateFrom={dueDateFrom}
            dueDateTo={dueDateTo}
            priorityFilter={priorityFilter}
            assigneeFilter={assigneeFilter}
            customerFilter={customerFilter}
            applicationFilter={applicationFilter}
            createdByFilter={createdByFilter}
            estimatedHoursMin={estimatedHoursMin}
            estimatedHoursMax={estimatedHoursMax}
            uniqueAssignees={getUniqueAssignees()}
            uniqueCustomers={getUniqueCustomers()}
            uniqueApplications={getUniqueApplications()}
            uniqueCreators={getUniqueCreators()}
            onSearchChange={setSearchFilter}
            onDueDateFromChange={setDueDateFrom}
            onDueDateToChange={setDueDateTo}
            onPriorityChange={setPriorityFilter}
            onAssigneeChange={setAssigneeFilter}
            onCustomerChange={setCustomerFilter}
            onApplicationChange={setApplicationFilter}
            onCreatedByChange={setCreatedByFilter}
            onEstimatedHoursMinChange={setEstimatedHoursMin}
            onEstimatedHoursMaxChange={setEstimatedHoursMax}
            onClearFilters={clearFilters}
          />
        </BoardHeader>

        {/* Mobile Navigation */}
        {isMobile && <MobileColumnsNavigation />}

        {/* Kanban Columns */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            {isMobile ? (
              // Mobile: Single Column View - Centered
              <Box
                sx={{
                  height: "100%",
                  overflowY: "auto",
                  px: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {statusColumns.map((status, index) => {
                  if (index !== activeTab) return null;

                  const column = getColumnByStatus(status);
                  const tickets = getTicketsForColumn(status);

                  return (
                    <Box
                      key={status}
                      sx={{
                        width: "100%",
                        maxWidth: "420px",
                        display: "flex",
                        justifyContent: "center",
                        mt: 3,
                      }}
                    >
                      <KanbanColumn
                        column={column}
                        status={status}
                        tickets={tickets}
                        boardId={boardId}
                      />
                    </Box>
                  );
                })}
              </Box>
            ) : (
              // Desktop: All Columns View
              <Box
                display="flex"
                gap={{ xs: 1, sm: 2 }}
                sx={{
                  height: "100%",
                  overflowX: "auto",
                  overflowY: "hidden",
                  pb: 2,
                  px: { xs: 1, sm: 2 },
                }}
              >
                {statusColumns.map((status) => {
                  const column = getColumnByStatus(status);
                  const tickets = getTicketsForColumn(status);

                  return (
                    <KanbanColumn
                      key={status}
                      column={column}
                      status={status}
                      tickets={tickets}
                      boardId={boardId}
                    />
                  );
                })}
              </Box>
            )}
          </DragDropContext>
        </Box>

        {/* Mobile Columns Drawer */}
        {isMobile && <ColumnsDrawer />}

        {/* Menu */}
        <BoardMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onRefresh={handleRefresh}
          onSettings={() => setSettingsOpen(true)}
          onAnalytics={() => setAnalyticsOpen(true)}
        />

        {/* Dialogs */}
        <CreateTicketDialog
          open={createTicketOpen}
          onClose={() => setCreateTicketOpen(false)}
          boardId={boardId}
        />

        {currentBoard && (
          <BoardSettingsDialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            board={currentBoard}
          />
        )}

        <BoardAnalyticsDialog
          open={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
          boardId={boardId}
        />

        <CreateBoardDialog
          open={createBoardOpen}
          onClose={() => setCreateBoardOpen(false)}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default KanbanBoard;
