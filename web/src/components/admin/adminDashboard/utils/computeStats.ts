import type { Customer, Application, Ticket } from '../../../../services/api/types';
import type { DashboardStats } from '../types/types';

export function computeDashboardStats(
  customers: Customer[],
  applications: Application[],
  tickets: Ticket[],
): DashboardStats {
  return {
    totalCustomers:     customers.length,
    activeCustomers:    customers.filter((c) => c.subscriptionStatus === 'ACTIVE' || c.subscriptionStatus === 'TRIAL').length,
    totalApplications:  applications.length,
    activeApplications: applications.filter((a) => a.isActive).length,
    totalTickets:       tickets.length,
    openTickets:        tickets.filter((t) => t.status === 'OPEN').length,
    inProgressTickets:  tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolvedTickets:    tickets.filter((t) => t.status === 'RESOLVED').length,
  };
}
