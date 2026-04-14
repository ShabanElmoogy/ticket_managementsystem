export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  avgEstimationAccuracy?: number | null;
  avgResolutionHours?: number | null;
}
