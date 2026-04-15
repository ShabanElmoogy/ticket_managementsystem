import { useMemo } from 'react';
import { useAuxData } from '../../../../shared/hooks/useAuxData';
import { customersApi } from '../../customers/api/customers';
import { applicationsApi } from '../../applications/api/applications';
import { ticketsApi } from '../../tickets/api/tickets';
import { computeDashboardStats, type AdminDashboardStats } from '../utils/computeStats';

export function useAdminDashboard() {
  const { data: customers = [],    isLoading: customersLoading } =
    useAuxData(['dashboard-customers'],    customersApi.getCustomers.bind(customersApi));

  const { data: applications = [], isLoading: appsLoading } =
    useAuxData(['dashboard-applications'], applicationsApi.getApplications.bind(applicationsApi));

  const { data: tickets = [],      isLoading: ticketsLoading } =
    useAuxData(['dashboard-tickets'],      () => ticketsApi.getTickets({}));

  const stats: AdminDashboardStats = useMemo(
    () => computeDashboardStats(customers, applications, tickets),
    [customers, applications, tickets],
  );

  return {
    stats,
    loading: customersLoading || appsLoading || ticketsLoading,
  };
}
