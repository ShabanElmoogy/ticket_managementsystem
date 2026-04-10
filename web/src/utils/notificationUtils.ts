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
  const { type, data } = socketNotification || {};
  const safeData: any = data || {};
  const safeTicket = safeData.ticket || {};
  let title = "";
  let message = "";

  switch (type) {
    case "TICKET_CREATED":
      title = "New Ticket Created";
      message = `${safeTicket.title || "Untitled ticket"} - Created by ${safeData.createdBy || "Someone"}`;
      break;
    case "TICKET_UPDATED":
      if (safeData.newStatus === "DELETED") {
        title = "Ticket Deleted";
        message = `${safeTicket.title || "Untitled ticket"} - Deleted by ${safeData.updatedBy || "Someone"}`;
      } else if (safeData.newStatus === "RESTORED") {
        title = "Ticket Restored";
        message = `${safeTicket.title || "Untitled ticket"} - Restored by ${safeData.updatedBy || "Someone"}`;
      } else {
        title = "Ticket Updated";
        message = `${safeTicket.title || "Untitled ticket"} - Updated by ${safeData.updatedBy || "Someone"}`;
      }
      break;
    case "TICKET_ASSIGNED":
      title = "Ticket Assigned";
      message = `${safeTicket.title || "Untitled ticket"} - Assigned to ${safeData.assignedTo || "a user"}`;
      break;
    case "COMMENT_ADDED":
      title = "New Comment";
      message = `${safeData.commentBy || "Someone"} commented: "${safeData.comment?.content || "No content"}" on ${safeTicket.title || "Untitled ticket"}`;
      break;
    case "COMMENT_DELETED":
      title = "Comment Deleted";
      message = `${safeData.commentBy || "Someone"} deleted a comment on ${safeTicket.title || "Untitled ticket"}`;
      break;
    case "TICKET_DUE_SOON":
      title = "Ticket Due Soon";
      message = safeData.message || `${safeTicket.title || "A ticket"} is due tomorrow`;
      break;
    case "TICKET_OVERDUE":
      title = "Ticket Overdue";
      message = safeData.message || `${safeTicket.title || "A ticket"} is overdue`;
      break;
    case "STATUS_CHANGED":
      title = "Ticket Status Changed";
      message = safeData.message || `${safeTicket.title || "A ticket"} status changed`;
      break;
    case "EPIC_FEATURE_STATUS_CHANGED":
      title = socketNotification.title || "Feature status updated";
      message = socketNotification.message || "A linked feature status changed";
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
    data: safeData,
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
