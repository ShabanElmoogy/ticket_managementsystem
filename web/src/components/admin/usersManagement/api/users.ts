import { BaseApiService } from "../../../../services/api/base";
import type { User, CreateUserData, UpdateUserData, UserStats } from "../../../../services/api/types";

export class UsersApiService extends BaseApiService {
  async getUsers(): Promise<User[]> {
    return this.get<User[]>("/users");
  }

  // Tenant admin: list users for current tenant
  async getTenantUsers(): Promise<User[]> {
    return this.get<User[]>("/users/tenant");
  }

  async getUser(id: string): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.post<User>("/users", data);
  }

  // Tenant admin: create user under current tenant
  async createTenantUser(data: CreateUserData): Promise<User> {
    return this.post<User>("/users/tenant", data);
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    return this.put<User>(`/users/${id}`, data);
  }

  async deleteUser(id: string, opts?: { force?: boolean }): Promise<{ message: string }> {
    const params = opts?.force ? { force: 'true' } : undefined;
    return this.delete<{ message: string }>(`/users/${id}`, { params });
  }

  async resetPassword(id: string, password: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/users/${id}/reset-password`, { password });
  }

  async getUserStats(): Promise<UserStats> {
    return this.get<UserStats>("/users/stats");
  }

  async getTenantStatus(): Promise<{ suspended: boolean }> {
    return this.get<{ suspended: boolean }>("/users/profile/tenant-status");
  }

  async getTenantSeats(): Promise<{ used: number; total: number }> {
    return this.get<{ used: number; total: number }>("/users/tenant/seats");
  }

  async getEmployees(): Promise<User[]> {
    return this.get<User[]>("/users/employees");
  }
}

export const usersApi = new UsersApiService();