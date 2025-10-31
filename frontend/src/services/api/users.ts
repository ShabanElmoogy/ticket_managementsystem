import { BaseApiService } from "./base";
import type { User, CreateUserData, UpdateUserData, UserStats } from "./types";

export class UsersApiService extends BaseApiService {
  async getUsers(): Promise<User[]> {
    return this.get<User[]>("/users");
  }

  async getUser(id: string): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.post<User>("/users", data);
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    return this.put<User>(`/users/${id}`, data);
  }

  async deleteUser(id: string, opts?: { force?: boolean }): Promise<{ message: string }> {
    const params = opts?.force ? { force: 'true' } : undefined;
    return this.delete<{ message: string }>(`/users/${id}`, { params });
  }

  async getUserStats(): Promise<UserStats> {
    return this.get<UserStats>("/users/stats");
  }

  async getEmployees(): Promise<User[]> {
    return this.get<User[]>("/users/employees");
  }
}

export const usersApi = new UsersApiService();