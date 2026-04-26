import { useMemo } from 'react';
import { useAuxData } from '@/src/shared/hooks/useAuxData';
import { applicationsApi } from '@/src/features/admin/applications/api/applications';
import { customersApi } from '@/src/features/admin/customers/api/customers';
import { ticketsApi } from '@/src/features/admin/tickets/api/tickets';
import { computeDashboardStats, type AdminDashboardStats } from '@/src/features/admin/dashboard/utils/computeStats';

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
