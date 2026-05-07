import type { NotificationType } from '@/src/services/api/types/notification';

export interface SocketNotificationPayload {
  id?: string;
  type?: NotificationType;
  title?: string;
  message?: string;
  timestamp?: string;
  data?: {
    ticket?: { id: string; title: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    commentBy?: string;
    mentionedBy?: string;
    mentionedUsers?: string[];
    comment?: { content?: string };
    newStatus?: string;
  };
}

export const createNotificationFromSocketData = (raw: SocketNotificationPayload) => {
  const { type, data } = raw ?? {};
  const safeData = data ?? {};
  const safeTicket = safeData.ticket ?? { title: 'Untitled ticket' };
  let title = '';
  let message = '';

  switch (type) {
    case 'TICKET_CREATED':
      title = 'New Ticket Created';
      message = `${safeTicket.title} - Created by ${safeData.createdBy ?? 'Someone'}`;
      break;
    case 'TICKET_UPDATED':
      if (safeData.newStatus === 'DELETED') {
        title = 'Ticket Deleted';
        message = `${safeTicket.title} - Deleted by ${safeData.updatedBy ?? 'Someone'}`;
      } else if (safeData.newStatus === 'RESTORED') {
        title = 'Ticket Restored';
        message = `${safeTicket.title} - Restored by ${safeData.updatedBy ?? 'Someone'}`;
      } else {
        title = 'Ticket Updated';
        message = `${safeTicket.title} - Updated by ${safeData.updatedBy ?? 'Someone'}`;
      }
      break;
    case 'TICKET_ASSIGNED':
      title = 'Ticket Assigned';
      message = `${safeTicket.title} - Assigned to ${safeData.assignedTo ?? 'a user'}`;
      break;
    case 'COMMENT_ADDED':
      title = 'New Comment';
      message = `${safeData.commentBy ?? 'Someone'} commented on ${safeTicket.title}`;
      break;
    case 'COMMENT_DELETED':
      title = 'Comment Deleted';
      message = `${safeData.commentBy ?? 'Someone'} deleted a comment on ${safeTicket.title}`;
      break;
    case 'TICKET_DUE_SOON':
      title = 'Ticket Due Soon';
      message = raw.message ?? `${safeTicket.title} is due tomorrow`;
      break;
    case 'TICKET_OVERDUE':
      title = 'Ticket Overdue';
      message = raw.message ?? `${safeTicket.title} is overdue`;
      break;
    case 'STATUS_CHANGED':
      title = 'Ticket Status Changed';
      message = raw.message ?? `${safeTicket.title} status changed`;
      break;
    case 'EPIC_FEATURE_STATUS_CHANGED':
      title = raw.title ?? 'Feature status updated';
      message = raw.message ?? 'A linked feature status changed';
      break;
    case 'COMMENT_MENTION': {
      const mentionedBy = safeData.mentionedBy ?? 'Someone';
      title = 'You were mentioned';
      message = `${mentionedBy} mentioned you on ${safeTicket.title}`;
      break;
    }
    case 'PRIORITY_ESCALATED':
      title = 'Priority Escalated';
      message = raw.message ?? `${safeTicket.title} priority was auto-escalated`;
      break;
    default:
      title = 'New Notification';
      message = 'You have a new notification';
  }

  return {
    id: raw.id ?? `${Date.now()}-${Math.random()}`,
    type,
    title,
    message,
    timestamp: raw.timestamp ?? new Date().toISOString(),
    read: false,
    data: safeData,
  };
};

// Note: playNotificationSound() is intentionally omitted — Audio API not available in RN.
// Use expo-av or expo-haptics for feedback instead.
