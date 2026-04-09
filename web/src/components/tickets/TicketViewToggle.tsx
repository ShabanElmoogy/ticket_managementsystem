import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { ViewList, GridView, TableRows } from '@mui/icons-material';
import { useThemeStore, type TicketView } from '../../stores/themeStore';

const TicketViewToggle: React.FC = () => {
  const { ticketView, setTicketView } = useThemeStore();

  return (
    <ToggleButtonGroup
      value={ticketView}
      exclusive
      onChange={(_e, val) => val && setTicketView(val as TicketView)}
      size="small"
      sx={{ height: 36 }}
    >
      <Tooltip title="List view">
        <ToggleButton value="list" sx={{ px: 1 }}>
          <ViewList fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Grid view">
        <ToggleButton value="grid" sx={{ px: 1 }}>
          <GridView fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Compact view">
        <ToggleButton value="compact" sx={{ px: 1 }}>
          <TableRows fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
};

export default TicketViewToggle;
