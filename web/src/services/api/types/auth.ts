import type { User } from './user.ts';

export type { UserRole } from './primitives.ts';

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  tenantSuspended?: boolean;
}
