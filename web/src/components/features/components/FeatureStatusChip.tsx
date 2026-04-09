import React from 'react';
import { Chip } from '@mui/material';
import type { FeatureRequest } from '../../../services/api/types';

const STATUS_MAP: Record<FeatureRequest['status'], { label: string; color: 'default' | 'info' | 'primary' | 'success' | 'error' }> = {
  UNDER_REVIEW: { label: 'Under Review', color: 'default' },
  PLANNED:      { label: 'Planned',      color: 'info' },
  IN_PROGRESS:  { label: 'In Progress',  color: 'primary' },
  SHIPPED:      { label: 'Shipped',      color: 'success' },
  DECLINED:     { label: 'Declined',     color: 'error' },
};

const FeatureStatusChip: React.FC<{ status: FeatureRequest['status'] }> = ({ status }) => {
  const { label, color } = STATUS_MAP[status] ?? STATUS_MAP.UNDER_REVIEW;
  return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600 }} />;
};

export default FeatureStatusChip;
