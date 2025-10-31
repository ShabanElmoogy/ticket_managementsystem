// utils/notificationUtils.ts
import { type Notification } from "../types/header";

export const formatNotificationTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export const createNotificationFromSocketData = (
  socketNotification: any
): Notification => {
  const { type, data } = socketNotification;
  let title = "";
  let message = "";

  switch (type) {
    case "TICKET_CREATED":
      title = "New Ticket Created";
      message = `${data.ticket?.title} - Created by ${data.createdBy}`;
      break;
    case "TICKET_UPDATED":
      title = "Ticket Updated";
      message = `${data.ticket?.title} - Updated by ${data.updatedBy}`;
      break;
    case "TICKET_ASSIGNED":
      title = "Ticket Assigned";
      message = `${data.ticket?.title} - Assigned to ${data.assignedTo}`;
      break;
    case "COMMENT_ADDED":
      title = "New Comment";
      message = `${data.ticket?.title} - Comment by ${data.commentBy}`;
      break;
    case "TICKET_DUE_SOON":
      title = "Ticket Due Soon";
      message = data.message || `${data.ticket?.title} is due tomorrow`;
      break;
    case "TICKET_OVERDUE":
      title = "Ticket Overdue";
      message = data.message || `${data.ticket?.title} is overdue`;
      break;
    case "STATUS_CHANGED":
      title = "Ticket Status Changed";
      message = data.message || `${data.ticket?.title} status changed`;
      break;
    default:
      title = "New Notification";
      message = "You have a new notification";
  }

  return {
    id: `${Date.now()}-${Math.random()}`,
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    data,
  };
};

export const playNotificationSound = () => {
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
    );
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore errors if audio fails
  } catch (error) {
    // Ignore audio errors
  }
};
