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
  tenantSuspended?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  status,
  tickets,
  boardId,
  tenantSuspended = false
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

const STATUS_STYLES: Record<TicketStatus, { bgLight: string; bgDark: string; borderColor: string }> = {
  OPEN:        { bgLight: 'rgba(219,234,254,0.6)',  bgDark: 'rgba(59,130,246,0.08)',  borderColor: '#2563eb' },
  IN_PROGRESS: { bgLight: 'rgba(255,237,213,0.6)',  bgDark: 'rgba(245,158,11,0.08)',  borderColor: '#d97706' },
  RESOLVED:    { bgLight: 'rgba(209,250,229,0.6)',  bgDark: 'rgba(16,185,129,0.08)',  borderColor: '#059669' },
  CLOSED:      { bgLight: 'rgba(243,244,246,0.6)',  bgDark: 'rgba(107,114,128,0.08)', borderColor: '#4b5563' },
};

  const colStyle = STATUS_STYLES[status] ?? STATUS_STYLES.CLOSED;

  return (
    <Paper
      sx={{
        minWidth: 300,
        maxWidth: 300,
        height: 'fit-content',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isWipLimitExceeded ? '2px solid #f44336' : 'none',
        borderLeft: `4px solid ${colStyle.borderColor}`,
        borderRadius: 2,
        transition: 'all 0.3s ease-in-out',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? colStyle.bgDark : colStyle.bgLight,
        backdropFilter: 'blur(8px)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0px 8px 25px rgba(0,0,0,0.4)'
            : '0px 8px 25px rgba(0,0,0,0.1)',
        },
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
                isDragDisabled={tenantSuspended}
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