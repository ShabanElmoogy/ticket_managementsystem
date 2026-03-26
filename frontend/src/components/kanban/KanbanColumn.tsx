import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Box,
  Paper,
  Typography,
  Badge,
  Chip,
  Alert
} from '@mui/material';
import type { KanbanColumn as KanbanColumnType, KanbanTicket, TicketStatus } from './types/types';
import KanbanTicketCard from './KanbanTicketCard';

interface KanbanColumnProps {
  column?: KanbanColumnType;
  status: TicketStatus;
  tickets: KanbanTicket[];
  boardId: string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  status,
  tickets,
  boardId
}) => {
  const getColumnTitle = () => {
    if (column) return column.name;
    
    // Fallback titles for default statuses
    switch (status) {
      case 'OPEN': return 'To Do';
      case 'IN_PROGRESS': return 'In Progress';
      case 'RESOLVED': return 'Review';
      case 'CLOSED': return 'Done';
      default: return status;
    }
  };


  const isWipLimitExceeded = column?.wipLimit && tickets.length > column.wipLimit;

  const getColumnClassName = () => {
    switch (status) {
      case 'OPEN': return 'kanban-column kanban-column-open';
      case 'IN_PROGRESS': return 'kanban-column kanban-column-in-progress';
      case 'RESOLVED': return 'kanban-column kanban-column-resolved';
      case 'CLOSED': return 'kanban-column kanban-column-closed';
      default: return 'kanban-column';
    }
  };

  return (
    <Paper
      className={getColumnClassName()}
      sx={{
        minWidth: 300,
        maxWidth: 300,
        height: 'fit-content',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isWipLimitExceeded ? '2px solid #f44336' : 'none',
        borderRadius: 2,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0px 8px 25px rgba(0, 0, 0, 0.4)'
            : '0px 8px 25px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      {/* Column Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="h2">
            {getColumnTitle()}
          </Typography>
          <Badge badgeContent={tickets.length} color="primary">
            <Box />
          </Badge>
        </Box>
        
        {column?.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {column.description}
          </Typography>
        )}

        {column?.wipLimit && (
          <Chip
            label={`WIP Limit: ${tickets.length}/${column.wipLimit}`}
            size="small"
            color={isWipLimitExceeded ? 'error' : 'default'}
            sx={{ mt: 1 }}
          />
        )}

        {isWipLimitExceeded && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            WIP limit exceeded!
          </Alert>
        )}
      </Box>

      {/* Column Content */}
      <Droppable droppableId={`column-${status}`}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              p: 1,
              minHeight: 200,
              maxHeight: 'calc(100vh - 300px)',
              overflowY: 'auto',
              backgroundColor: snapshot.isDraggingOver 
                ? 'rgba(0, 0, 0, 0.05)' 
                : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
          >
            {tickets.map((ticket, index) => (
              <Draggable
                key={ticket.id}
                draggableId={ticket.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      marginBottom: 8
                    }}
                  >
                    <KanbanTicketCard
                      ticket={ticket}
                      isDragging={snapshot.isDragging}
                      boardId={boardId}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {tickets.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 100,
                  color: 'text.secondary',
                  fontStyle: 'italic'
                }}
              >
                No tickets
              </Box>
            )}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
};

export default KanbanColumn;