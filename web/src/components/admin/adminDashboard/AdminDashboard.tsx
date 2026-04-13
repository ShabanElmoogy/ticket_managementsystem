import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import { ErrorBoundary } from '../../../shared/components/feedback/ErrorBoundary';
import { MetricCard, OverviewCard } from '../../../shared/components';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { STAT_CARDS_CONFIG } from './utils/statCardsConfig';

/** Resolve a dot-path like 'primary.main' from the MUI palette */
const resolvePalette = (palette: Record<string, unknown>, path: string): string =>
  path.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], palette) as string;

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const { stats, loading, error } = useAdminDashboard();

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  if (error)   return <Alert severity="error" sx={{ mb: 2 }}>{error.message ?? 'Error fetching stats'}</Alert>;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Admin Dashboard</Typography>

      <Grid container spacing={3}>
        {STAT_CARDS_CONFIG.map(({ title, getValue, Icon, paletteKey }) => (
          <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title={title}
              value={getValue(stats)}
              icon={<Icon />}
              color={resolvePalette(theme.palette as unknown as Record<string, unknown>, paletteKey)}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <OverviewCard title="Customer Overview"    total={stats.totalCustomers}    active={stats.activeCustomers} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <OverviewCard title="Application Overview" total={stats.totalApplications} active={stats.activeApplications} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <OverviewCard
            title="Ticket Overview"
            total={stats.totalTickets}
            active={stats.openTickets}
            activeLabel="open and need attention"
            metricLabel="Resolution Rate"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default function AdminDashboardWithBoundary() {
  return <ErrorBoundary><AdminDashboard /></ErrorBoundary>;
}
