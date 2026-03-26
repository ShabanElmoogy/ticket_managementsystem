// types/dashboard.ts
export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  avgEstimationAccuracy?: number | null;
}

export interface ActiveFilters {
  status?: string;
  priority?: string;
  user?: string;
  customer?: string;
  application?: string;
  search?: string;
  userName?: string;
  customerName?: string;
  applicationName?: string;
}

export interface StatItem {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  gradient: string;
  percentage?: number;
  suffix?: string;
}

export interface StatsCardsProps {
  stats: DashboardStats;
  isFiltered?: boolean;
  activeFilters?: ActiveFilters;
}
