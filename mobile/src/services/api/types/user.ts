import type { UserRole } from './primitives';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string | null;
  tenantName?: string | null;
  phone?: string;
  whatsappNotifications?: boolean;
  reminderEnabled?: boolean;
  reminderInterval?: number;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    assignedTickets: number;
    createdTickets: number;
    comments: number;
  };
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  phone?: string;
  whatsappNotifications?: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  phone?: string;
  whatsappNotifications?: boolean;
  reminderEnabled?: boolean;
  reminderInterval?: number;
}

export interface ReminderSettings {
  reminderEnabled: boolean;
  reminderInterval: number;
}

export interface UserStats {
  total: number;
  active: number;
  byRole: {
    SUPER_ADMIN?: number;
    TENANT_ADMIN?: number;
    EMPLOYEE?: number;
    PROGRAMMER?: number;
  };
}
