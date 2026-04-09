import type { ActivityItem as ApiActivityItem } from '../../../../../../services/api/types';

export type ActivityItem = ApiActivityItem;
export type ActivityTypeFilter =
  | "ALL"
  | "TICKET_CREATED"
  | "TICKET_UPDATED"
  | "TICKET_ASSIGNED"
  | "COMMENT_ADDED"
  | "COMMENT_DELETED"
  | "COMMENT_MENTION"
  | "TICKET_DELETED"
  | "TICKET_RESTORED";

export interface ActivityFeedProps {
  onTicketClick: (ticket: ActivityItem["data"]["ticket"]) => void;
}
