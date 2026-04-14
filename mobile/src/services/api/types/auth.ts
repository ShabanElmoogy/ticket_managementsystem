import type { User } from './user';

export type { UserRole } from './primitives';

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  tenantSuspended?: boolean;
  tenantStatus?: string | null;
}
