import React from 'react';
import { Box, Chip } from '@mui/material';
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
              backgroundColor: column?.color || "transparent",
              color: column?.color ? "white" : "inherit",
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