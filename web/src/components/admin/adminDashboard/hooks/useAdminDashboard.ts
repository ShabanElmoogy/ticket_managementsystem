import { useMemo } from 'react';
import { useAuxData } from '../../../../shared/hooks/useAuxData';
import { customersApi } from '../../customersManagement';
import { applicationsApi } from '../../applicationsManagement';
import { ticketsApi } from '../../ticketsManagement';
import { computeDashboardStats } from '../utils/computeStats';
import type { DashboardStats } from '../types/types';

interface UseAdminDashboardResult {
  stats: DashboardStats;
  loading: boolean;
  error: Error | null;
}

export function useAdminDashboard(): UseAdminDashboardResult {
  const { data: customers = [],    isLoading: customersLoading, error: customersError } =
    useAuxData(['dashboard-customers'],    customersApi.getCustomers.bind(customersApi));

  const { data: applications = [], isLoading: appsLoading,      error: appsError } =
    useAuxData(['dashboard-applications'], applicationsApi.getApplications.bind(applicationsApi));

  const { data: tickets = [],      isLoading: ticketsLoading,   error: ticketsError } =
    useAuxData(['dashboard-tickets'],      () => ticketsApi.getTickets({}));

  const stats = useMemo(
    () => computeDashboardStats(customers, applications, tickets),
    [customers, applications, tickets],
  );

  return {
    stats,
    loading: customersLoading || appsLoading || ticketsLoading,
    error:   (customersError || appsError || ticketsError) as Error | null,
  };
}
