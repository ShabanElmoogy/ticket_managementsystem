import { API, QUERY_KEYS } from '@/src/constants/api';
import { BaseApiService } from '@/src/services/api/base';
import type { User, CreateUserData, UpdateUserData, UserStats } from '@/src/services/api/types';

export class UsersApiService extends BaseApiService {
  getUsers              = (params?: Record<string, string>)         => this.get<User[]>(API.USERS.LIST, { params });
  getTenantUsers        = (params?: Record<string, string>)         => this.get<User[]>(API.USERS.TENANT, { params });
  getUser               = (id: string)                             => this.get<User>(API.USERS.BY_ID(id));
  createUser            = (data: CreateUserData)                   => this.post<User>(API.USERS.LIST, data);
  createTenantUser      = (data: CreateUserData)                   => this.post<User>(API.USERS.TENANT, data);
  updateUser            = (id: string, data: UpdateUserData)       => this.put<User>(API.USERS.BY_ID(id), data);
  updateTenantUser      = (id: string, data: UpdateUserData)       => this.put<User>(API.USERS.TENANT_BY_ID(id), data);
  deleteUser            = (id: string, opts?: { force?: boolean }) =>
    this.delete<{ message: string }>(API.USERS.BY_ID(id), { params: opts?.force ? { force: 'true' } : undefined });
  forceDeleteUser       = (id: string) =>
    this.delete<{ message: string }>(API.USERS.BY_ID(id), { params: { force: 'true' } });
  deleteTenantUser      = (id: string) =>
    this.delete<{ message: string }>(API.USERS.TENANT_BY_ID(id));
  forceTenantDeleteUser = (id: string) =>
    this.delete<{ message: string }>(API.USERS.TENANT_BY_ID(id), { params: { force: 'true' } });
  resetPassword         = (id: string, password: string) =>
    this.post<{ message: string }>(API.USERS.RESET_PASSWORD(id), { password });
  resetTenantUserPassword = (id: string, password: string) =>
    this.post<{ message: string }>(API.USERS.TENANT_RESET_PW(id), { password });
  getUserStats          = ()                                        => this.get<UserStats>(API.USERS.STATS);
  getTenantSeats        = ()                                        => this.get<{ used: number; total: number }>(API.USERS.TENANT_SEATS);
  getEmployees          = ()                                        => this.get<User[]>(API.USERS.EMPLOYEES);
  getProgrammers        = ()                                        => this.get<User[]>(API.USERS.PROGRAMMERS);
  getProfile            = ()                                        => this.get<User>(API.USERS.PROFILE);
  updateProfile         = (data: Partial<UpdateUserData>)          => this.put<User>(API.USERS.PROFILE, data);
}

export const usersApi = new UsersApiService();

export const usersKeys = {
  ...QUERY_KEYS.USERS,
  tenant:       ['users', 'tenant']                         as const,
  tenantScoped: (slug: string) => ['users', 'tenant', slug] as const,
};
