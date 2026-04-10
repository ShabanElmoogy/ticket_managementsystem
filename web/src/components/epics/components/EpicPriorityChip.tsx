import React from 'react';
import { Chip } from '@mui/material';
import type { Epic } from '../../../services/api/types';

const CONFIG: Record<Epic['priority'], { label: string; color: string }> = {
  LOW:      { label: 'Low',      color: '#4caf50' },
  MEDIUM:   { label: 'Medium',   color: '#ff9800' },
  HIGH:     { label: 'High',     color: '#f44336' },
  CRITICAL: { label: 'Critical', color: '#9c27b0' },
};

const EpicPriorityChip: React.FC<{ priority: Epic['priority'] }> = ({ priority }) => {
  const { label, color } = CONFIG[priority] ?? CONFIG.MEDIUM;
  return (
    <Chip
      label={label}
      size="small"
      sx={{ bgcolor: color, color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}
    />
  );
};

export default EpicPriorityChip;
