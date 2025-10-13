// types/header.ts
export interface HeaderProps {
  onOpenAdminPanel?: () => void;
  onOpenKanban?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenWhatsAppUsers?: () => void;
  onTicketClick?: (ticket: any) => void;
}

export interface Notification {
  id: string;
  type:
    | "TICKET_CREATED"
    | "TICKET_UPDATED"
    | "TICKET_ASSIGNED"
    | "COMMENT_ADDED";
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

export interface UserInfo {
  id: string;
  name: string;
  role: "ADMIN" | "USER" | "EMPLOYEE";
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