import { BaseApiService } from '../../../../services/api/base';
import type { User, CreateUserData, UpdateUserData, UserStats } from '../../../../services/api/types';

export class UsersApiService extends BaseApiService {
  getUsers          = ()                                        => this.get<User[]>('/users');
  getTenantUsers    = ()                                        => this.get<User[]>('/users/tenant');
  getUser           = (id: string)                             => this.get<User>(`/users/${id}`);
  createUser        = (data: CreateUserData)                   => this.post<User>('/users', data);
  createTenantUser  = (data: CreateUserData)                   => this.post<User>('/users/tenant', data);
  updateUser        = (id: string, data: UpdateUserData)       => this.put<User>(`/users/${id}`, data);
  updateTenantUser  = (id: string, data: UpdateUserData)       => this.put<User>(`/users/tenant/${id}`, data);
  deleteUser        = (id: string, opts?: { force?: boolean }) =>
    this.delete<{ message: string }>(`/users/${id}`, { params: opts?.force ? { force: 'true' } : undefined });
  forceDeleteUser   = (id: string) =>
    this.delete<{ message: string }>(`/users/${id}`, { params: { force: 'true' } });
  deleteTenantUser      = (id: string) =>
    this.delete<{ message: string }>(`/users/tenant/${id}`);
  forceTenantDeleteUser = (id: string) =>
    this.delete<{ message: string }>(`/users/tenant/${id}`, { params: { force: 'true' } });
  resetPassword     = (id: string, password: string)          => this.post<{ message: string }>(`/users/${id}/reset-password`, { password });
  resetTenantUserPassword = (id: string, password: string)    => this.post<{ message: string }>(`/users/tenant/${id}/reset-password`, { password });
  getUserStats      = ()                                        => this.get<UserStats>('/users/stats');
  getTenantSeats    = ()                                        => this.get<{ used: number; total: number }>('/users/tenant/seats');
  getEmployees      = ()                                        => this.get<User[]>('/users/employees');
  getProgrammers    = ()                                        => this.get<User[]>('/users/programmers');
}

export const usersApi = new UsersApiService();

export const usersKeys = {
  all:          ['users']                                          as const,
  tenant:       ['users', 'tenant']                               as const,
  detail:       (id: string) => ['users', id]                     as const,
  tenantScoped: (slug: string) => ['users', 'tenant', slug]       as const,
};
