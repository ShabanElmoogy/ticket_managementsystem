export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  /** Sum of PROGRAMMING + UNDER_DEVELOPMENT + CODE_REVIEW + TESTING tickets */
  programmingPhaseTickets: number;
  avgEstimationAccuracy?: number | null;
  avgResolutionHours?: number | null;
}
