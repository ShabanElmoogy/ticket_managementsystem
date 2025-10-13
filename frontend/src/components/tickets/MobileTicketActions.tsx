import React, { useState } from 'react';
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useTheme,
  useMediaQuery,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

interface MobileTicketActionsProps {
  onOpenFilters: () => void;
  onRefresh: () => void;
  onOpenSearch: () => void;
  onOpenSort: () => void;
  showCreateButton?: boolean;
  onCreateTicket?: () => void;
  disableFixed?: boolean; // If true, do not use fixed positioning
}

const MobileTicketActions: React.FC<MobileTicketActionsProps> = ({
  onOpenFilters,
  onRefresh,
  onOpenSearch,
  onOpenSort,
  showCreateButton = false,
  onCreateTicket,
  disableFixed = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  if (!isMobile) return null;

  const actions = [
    { icon: <FilterIcon />, name: 'Filters', onClick: onOpenFilters },
    { icon: <SearchIcon />, name: 'Search', onClick: onOpenSearch },
    { icon: <SortIcon />, name: 'Sort', onClick: onOpenSort },
    { icon: <RefreshIcon />, name: 'Refresh', onClick: onRefresh },
  ];

  if (showCreateButton && onCreateTicket) {
    actions.unshift({ icon: <AddIcon />, name: 'Create Ticket', onClick: onCreateTicket });
  }

  return (
    <Box
      sx={{
        position: disableFixed ? 'static' : 'fixed',
        bottom: disableFixed ? undefined : 16,
        right: disableFixed ? undefined : 16,
        zIndex: disableFixed ? 'auto' : 1000,
      }}
    >
      <SpeedDial
        ariaLabel="Ticket Actions"
        sx={{
          '& .MuiFab-primary': {
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        }}
        icon={<SpeedDialIcon />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        direction="up"
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.onClick();
              setOpen(false);
            }}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                backgroundColor: 'background.paper',
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

export default MobileTicketActions;