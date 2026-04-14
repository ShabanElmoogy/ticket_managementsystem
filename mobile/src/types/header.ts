import type { UserRole } from './roles';
import type { NotificationType } from '../services/api/types/notification';

export interface Notification {
  id: string;
  type: NotificationType | 'MENTION';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface UserInfo {
  id: string;
  name: string;
  role: UserRole;
}
