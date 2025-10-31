import { BaseApiService } from "./base";
import type { DashboardStats, ActivityItem } from "./types";

export class DashboardApiService extends BaseApiService {
  async getDashboardStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>("/dashboard/stats");
  }

  async getActivities(limit?: number): Promise<ActivityItem[]> {
    const params = limit ? { limit: limit.toString() } : {};
    return this.get<ActivityItem[]>("/dashboard/activities", { params });
  }
}

export const dashboardApi = new DashboardApiService();