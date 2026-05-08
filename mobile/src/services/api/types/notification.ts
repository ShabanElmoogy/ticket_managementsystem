export type NotificationType =
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED'
  | 'COMMENT_MENTION'
  | 'TICKET_DUE_SOON'
  | 'TICKET_OVERDUE'
  | 'STATUS_CHANGED'
  | 'PRIORITY_ESCALATED'
  | 'EPIC_FEATURE_STATUS_CHANGED';

export interface Notification {
  id: string;
  type: NotificationType;
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    reassignedTo?: string;
    description?: string;
    commentBy?: string;
    newStatus?: string;
  };
  timestamp: string;
  read?: boolean;
}

export interface ActivityItem {
  /** Display ID — may be synthetic for socket-injected items */
  id: string;
  /** Real notification UUID from the DB — only present for persisted notifications */
  notificationId?: string;
  type: NotificationType;
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    reassignedTo?: string;
    description?: string;
    commentBy?: string;
    mentionedBy?: string;
    mentionedUsers?: string[];
    comment?: string;
    newStatus?: string;
  };
  timestamp: string;
  read?: boolean;
}
