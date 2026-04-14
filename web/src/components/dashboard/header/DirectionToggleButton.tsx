import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

interface Props {
  direction: 'ltr' | 'rtl';
  onToggle: () => void;
}

const DirectionToggleButton: React.FC<Props> = ({ direction, onToggle }) => (
  <Tooltip title={direction === 'ltr' ? 'Switch to RTL' : 'Switch to LTR'}>
    <IconButton
      size="large"
      onClick={onToggle}
      color="inherit"
      sx={{
        width: 40, height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
        border: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: 0.5,
        mr: 1,
      }}
    >
      {direction === 'ltr' ? 'RTL' : 'LTR'}
    </IconButton>
  </Tooltip>
);

export default DirectionToggleButton;
