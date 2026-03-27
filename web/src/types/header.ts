// types/header.ts
export interface HeaderProps {
  onTicketClick?: (ticket: any) => void;
}

export interface Notification {
  id: string;
  type:
    | "TICKET_CREATED"
    | "TICKET_UPDATED"
    | "TICKET_ASSIGNED"
    | "COMMENT_ADDED"
    | "TICKET_DUE_SOON"
    | "TICKET_OVERDUE"
    | "STATUS_CHANGED"
    | "MENTION";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export interface MenuItem {
  label: string;
  icon: React.ReactElement;
  onClick: () => void;
  color?: string;
}

import type { UserRole } from './roles';

export interface UserInfo {
  id: string;
  name: string;
  role: UserRole;
}

export interface NotificationComponentProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onNotificationClick: (event: React.MouseEvent<HTMLElement>) => void;
  onNotificationClose: () => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onRemoveNotification: (id: string) => void;
  onNotificationItemClick: (notification: Notification) => void;
  anchorEl: HTMLElement | null;
  isMobile: boolean;
}