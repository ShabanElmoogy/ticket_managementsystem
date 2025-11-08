import React from 'react';
import { Box, Chip, useTheme } from '@mui/material';
import type { KanbanColumn as KanbanColumnType, TicketStatus } from '../../../types/kanban';

interface BoardStatsProps {
  statusColumns: TicketStatus[];
  getTicketsForColumn: (status: TicketStatus) => any[];
  getColumnByStatus: (status: TicketStatus) => KanbanColumnType | undefined;
  hasActiveFilters: boolean;
}

const BoardStats: React.FC<BoardStatsProps> = ({
  statusColumns,
  getTicketsForColumn,
  getColumnByStatus,
  hasActiveFilters,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const getStatusColor = (status: TicketStatus) => {
    if (isDarkMode) {
      switch (status) {
        case 'OPEN': return '#2563eb';
        case 'IN_PROGRESS': return '#d97706';
        case 'RESOLVED': return '#059669';
        case 'CLOSED': return '#4b5563';
        default: return '#2563eb';
      }
    }
    switch (status) {
      case 'OPEN': return '#1d4ed8';
      case 'IN_PROGRESS': return '#b45309';
      case 'RESOLVED': return '#047857';
      case 'CLOSED': return '#374151';
      default: return '#1d4ed8';
    }
  };
  return (
    <Box
      display="flex"
      gap={{ xs: 1, sm: 2 }}
      mt={2}
      flexWrap="wrap"
      sx={{
        '& .MuiChip-root': {
          fontSize: { xs: '0.7rem', sm: '0.8125rem' },
          height: { xs: 24, sm: 32 }
        }
      }}
    >
      {statusColumns.map((status) => {
        const tickets = getTicketsForColumn(status);
        const column = getColumnByStatus(status);
        return (
          <Chip
            key={status}
            label={`${column?.name || status}: ${tickets.length}`}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: getStatusColor(status),
              color: isDarkMode ? '#ffffff' : '#ffffff',
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              '&:hover': {
                backgroundColor: getStatusColor(status),
                opacity: 0.8,
              }
            }}
          />
        );
      })}
      {hasActiveFilters && (
        <Chip
          label="Filters Active"
          size="small"
          color="primary"
          variant="filled"
        />
      )}
    </Box>
  );
};

export default BoardStats;