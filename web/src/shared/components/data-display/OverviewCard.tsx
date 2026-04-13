import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export interface OverviewCardProps {
  title: string;
  total: number;
  active: number;
  activeLabel?: string;
  metricLabel?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  total,
  active,
  activeLabel = 'active',
  metricLabel = 'Active Rate',
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {total} total, {active} currently {activeLabel}.
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {metricLabel}:{' '}
        {total > 0 ? Math.round((active / total) * 100) : 0}%
      </Typography>
    </CardContent>
  </Card>
);

export default OverviewCard;
