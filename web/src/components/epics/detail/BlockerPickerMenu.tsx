import React from 'react';
import { Box, Menu, MenuItem } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';

interface Props {
  anchor: HTMLElement | null;
  epicId: string;
  blockedBy: { id: string; title: string; status: string }[];
  onClose: () => void;
  onAdd: (blockerId: string) => void;
}

const BlockerPickerMenu: React.FC<Props> = ({ anchor, epicId, blockedBy, onClose, onAdd }) => {
  const { data: allEpics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => epicsApi.list(),
    enabled: !!anchor,
  });
  const available = allEpics.filter((e) => e.id !== epicId && !blockedBy.some((b) => b.id === e.id));
  return (
    <Menu anchorEl={anchor} open={!!anchor} onClose={onClose} disableScrollLock>
      <MenuItem disabled sx={{ fontSize: '0.75rem', opacity: 0.6 }}>Select an epic that blocks this one</MenuItem>
      {available.length === 0
        ? <MenuItem disabled>No other epics available</MenuItem>
        : available.map((e) => (
          <MenuItem key={e.id} onClick={() => { onAdd(e.id); onClose(); }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1, flexShrink: 0 }} />
            {e.title}
          </MenuItem>
        ))}
    </Menu>
  );
};

export default BlockerPickerMenu;
