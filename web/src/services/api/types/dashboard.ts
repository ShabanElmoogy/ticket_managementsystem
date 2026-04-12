export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgEstimationAccuracy?: number | null;
  avgResolutionHours?: number | null;
}
