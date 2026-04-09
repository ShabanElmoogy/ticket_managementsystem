import React from 'react';
import { Chip } from '@mui/material';
import type { Epic } from '../../../services/api/types';

const COLOR: Record<Epic['status'], 'default' | 'info' | 'success' | 'error'> = {
  DRAFT: 'default', ACTIVE: 'info', COMPLETED: 'success', CANCELLED: 'error',
};

const EpicStatusChip: React.FC<{ status: Epic['status'] }> = ({ status }) => (
  <Chip label={status} size="small" color={COLOR[status]} />
);

export default EpicStatusChip;
