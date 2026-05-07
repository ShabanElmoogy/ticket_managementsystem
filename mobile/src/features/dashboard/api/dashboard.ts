import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { DashboardStats } from '@/src/services/api/types/dashboard';
import type { ActivityItem } from '@/src/services/api/types/notification';

export class DashboardApiService extends BaseApiService {
  getStats = () =>
    this.get<DashboardStats>(API.DASHBOARD.STATS);

  getActivities = (limit = 20) =>
    this.get<ActivityItem[]>(`${API.DASHBOARD.ACTIVITIES}?limit=${limit}`);
}

export const dashboardApi  = new DashboardApiService();
export const dashboardKeys = QUERY_KEYS.DASHBOARD;
