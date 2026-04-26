import type { Customer, Application, Ticket } from '@/src/services/api/types';

export interface AdminDashboardStats {
  totalCustomers:     number;
  activeCustomers:    number;
  totalApplications:  number;
  activeApplications: number;
  totalTickets:       number;
  openTickets:        number;
  inProgressTickets:  number;
  resolvedTickets:    number;
}

export function computeDashboardStats(
  customers: Customer[],
  applications: Application[],
  tickets: Ticket[],
): AdminDashboardStats {
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
