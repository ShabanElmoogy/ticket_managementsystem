import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import {
  People as PeopleIcon,
  Apps as AppsIcon,
  ConfirmationNumber as TicketIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuxData } from '../../../shared/hooks/useAuxData';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { customersApi, applicationsApi, ticketsApi } from '../../../services/api';
import StatCard from './components/StatCard';

const AdminDashboard: React.FC = () => {
  const theme = useTheme();

  const { data: customers = [], isLoading: customersLoading, error: customersError } =
    useAuxData(['dashboard-customers'], customersApi.getCustomers.bind(customersApi));

  const { data: applications = [], isLoading: appsLoading, error: appsError } =
    useAuxData(['dashboard-applications'], applicationsApi.getApplications.bind(applicationsApi));

  const { data: tickets = [], isLoading: ticketsLoading, error: ticketsError } =
    useAuxData(['dashboard-tickets'], () => ticketsApi.getTickets({}));

  const loading = customersLoading || appsLoading || ticketsLoading;
  const error = customersError || appsError || ticketsError;

  const stats = useMemo(() => {
    const activeCustomers     = customers.filter((c) => c.subscriptionStatus === 'ACTIVE' || c.subscriptionStatus === 'TRIAL').length;
    const activeApplications  = applications.filter((a) => a.isActive).length;
    const openTickets         = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgressTickets   = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolvedTickets     = tickets.filter((t) => t.status === 'RESOLVED').length;
    return {
      totalCustomers:    customers.length,
      activeCustomers,
      totalApplications: applications.length,
      activeApplications,
      totalTickets:      tickets.length,
      openTickets,
      inProgressTickets,
      resolvedTickets,
    };
  }, [customers, applications, tickets]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error instanceof Error ? error.message : 'Error fetching stats'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Customers"      value={stats.totalCustomers}    icon={<PeopleIcon />}      color={theme.palette.primary.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Customers"     value={stats.activeCustomers}   icon={<PeopleIcon />}      color={theme.palette.success.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Applications"   value={stats.totalApplications} icon={<AppsIcon />}        color={theme.palette.secondary.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Applications"  value={stats.activeApplications}icon={<AppsIcon />}        color={theme.palette.success.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Tickets"        value={stats.totalTickets}      icon={<TicketIcon />}      color={theme.palette.warning.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Open Tickets"         value={stats.openTickets}       icon={<TicketIcon />}      color={theme.palette.error.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="In Progress"          value={stats.inProgressTickets} icon={<TrendingUpIcon />}  color={theme.palette.warning.light} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Resolved"             value={stats.resolvedTickets}   icon={<TicketIcon />}      color={theme.palette.success.main} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Customer Overview</Typography>
              <Typography variant="body2" color="textSecondary">
                You have {stats.totalCustomers} customers in total, with {stats.activeCustomers} currently active.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Active Rate:{' '}
                {stats.totalCustomers > 0
                  ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100)
                  : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Application Overview</Typography>
              <Typography variant="body2" color="textSecondary">
                You have {stats.totalApplications} applications in total, with {stats.activeApplications} currently active.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Active Rate:{' '}
                {stats.totalApplications > 0
                  ? Math.round((stats.activeApplications / stats.totalApplications) * 100)
                  : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Ticket Overview</Typography>
              <Typography variant="body2" color="textSecondary">
                You have {stats.totalTickets} tickets in total. {stats.openTickets} are open and need attention.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Resolution Rate:{' '}
                {stats.totalTickets > 0
                  ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
                  : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const AdminDashboardWithBoundary: React.FC = () => (
  <ErrorBoundary>
    <AdminDashboard />
  </ErrorBoundary>
);

export default AdminDashboardWithBoundary;
