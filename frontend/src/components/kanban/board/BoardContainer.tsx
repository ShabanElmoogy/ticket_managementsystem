import React, { useEffect, useState } from 'react';
import {
  Box,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { isAfter, isBefore, parseISO } from 'date-fns';

import { useKanbanStore } from '../../../stores/kanbanStore';
import type {
  KanbanColumn as KanbanColumnType,
  KanbanTicket,
  TicketStatus,
} from '../../../types/kanban';

import BoardHeader from './BoardHeader';
import BoardControls from './BoardControls';
import BoardStats from './BoardStats';
import BoardFilters from './BoardFilters';
import BoardMenu from './BoardMenu';
import KanbanColumn from '../KanbanColumn';
import CreateTicketDialog from '../CreateTicketDialog';
import BoardSettingsDialog from '../BoardSettingsDialog';
import BoardAnalyticsDialog from '../BoardAnalyticsDialog';
import CreateBoardDialog from '../CreateBoardDialog';

interface BoardContainerProps {
  boardId: string;
  boards: any[];
  selectedBoardId: string;
  setSelectedBoardId: (id: string) => void;
  handleBoardChange: (id: string) => void;
  handleCreateBoard: () => void;
  createBoardOpen: boolean;
  setCreateBoardOpen: (open: boolean) => void;
}

const BoardContainer: React.FC<BoardContainerProps> = ({
  boardId,
  boards,
  selectedBoardId,
  handleBoardChange,
  handleCreateBoard,
  createBoardOpen,
  setCreateBoardOpen,
}) => {
  const {
    currentBoard,
    loading,
    error,
    fetchBoard,
    moveTicket,
    clearError,
  } = useKanbanStore();

  // UI State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter State
  const [dueDateFrom, setDueDateFrom] = useState<Date | null>(null);
  const [dueDateTo, setDueDateTo] = useState<Date | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [applicationFilter, setApplicationFilter] = useState<string>('');
  const [createdByFilter, setCreatedByFilter] = useState<string>('');
  const [estimatedHoursMin, setEstimatedHoursMin] = useState<number | ''>('');
  const [estimatedHoursMax, setEstimatedHoursMax] = useState<number | ''>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

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
      'column-',
      ''
    ) as TicketStatus;

    try {
      await moveTicket(draggableId, newStatus, destination.index, boardId);
    } catch (error) {
      console.error('Failed to move ticket:', error);
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
  };

  const getTicketsForColumn = (status: TicketStatus): KanbanTicket[] => {
    if (!currentBoard) return [];

    return currentBoard.tickets
      .filter((ticket) => {
        // Filter by column status
        if (ticket.status !== status) return false;

        // Search filter
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

        // Due date range filter
        if (dueDateFrom || dueDateTo) {
          if (!ticket.dueDate) return false;

          const ticketDueDate = parseISO(ticket.dueDate);

          if (dueDateFrom && isBefore(ticketDueDate, dueDateFrom)) {
            return false;
          }

          if (dueDateTo && isAfter(ticketDueDate, dueDateTo)) {
            return false;
          }
        }

        // Priority filter
        if (priorityFilter && ticket.priority !== priorityFilter) {
          return false;
        }

        // Assignee filter
        if (assigneeFilter) {
          if (assigneeFilter === 'unassigned' && ticket.assignedTo) {
            return false;
          }
          if (
            assigneeFilter !== 'unassigned' &&
            ticket.assignedTo?.id !== assigneeFilter
          ) {
            return false;
          }
        }

        // Customer filter
        if (customerFilter) {
          if (customerFilter === 'no-customer' && ticket.customer) {
            return false;
          }
          if (
            customerFilter !== 'no-customer' &&
            ticket.customer?.id !== customerFilter
          ) {
            return false;
          }
        }

        // Application filter
        if (applicationFilter) {
          if (applicationFilter === 'no-application' && ticket.application) {
            return false;
          }
          if (
            applicationFilter !== 'no-application' &&
            ticket.application?.id !== applicationFilter
          ) {
            return false;
          }
        }

        // Created by filter
        if (createdByFilter && ticket.createdBy?.id !== createdByFilter) {
          return false;
        }

        // Number-based estimated hours filter
        if (estimatedHoursMin !== '' || estimatedHoursMax !== '') {
          const hours = ticket.estimatedHours || 0;
          if (estimatedHoursMin !== '' && hours < estimatedHoursMin) {
            return false;
          }
          if (estimatedHoursMax !== '' && hours > estimatedHoursMax) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.position - b.position);
  };

  const clearFilters = () => {
    setDueDateFrom(null);
    setDueDateTo(null);
    setPriorityFilter('');
    setAssigneeFilter('');
    setCustomerFilter('');
    setApplicationFilter('');
    setCreatedByFilter('');
    setEstimatedHoursMin('');
    setEstimatedHoursMax('');
    setSearchFilter('');
  };

  const hasActiveFilters = Boolean(
    dueDateFrom ||
    dueDateTo ||
    priorityFilter ||
    assigneeFilter ||
    customerFilter ||
    applicationFilter ||
    createdByFilter ||
    estimatedHoursMin !== '' ||
    estimatedHoursMax !== '' ||
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
        col.name.toUpperCase().replace(/\s+/g, '_') === status ||
        (status === 'OPEN' && col.name.toLowerCase().includes('todo')) ||
        (status === 'IN_PROGRESS' &&
          col.name.toLowerCase().includes('progress')) ||
        (status === 'RESOLVED' && col.name.toLowerCase().includes('review')) ||
        (status === 'CLOSED' && col.name.toLowerCase().includes('done'))
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
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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

          <BoardStats
            statusColumns={statusColumns}
            getTicketsForColumn={getTicketsForColumn}
            getColumnByStatus={getColumnByStatus}
            hasActiveFilters={hasActiveFilters}
          />

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

        {/* Kanban Columns */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Box
              display="flex"
              gap={{ xs: 1, sm: 2 }}
              sx={{
                height: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                pb: 2,
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
          </DragDropContext>
        </Box>

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

export default BoardContainer;