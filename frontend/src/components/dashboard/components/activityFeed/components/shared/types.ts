export interface ActivityItem {
  id: string;
  type: "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED" | "COMMENT_DELETED";
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    reassignedTo?: string;
    commentBy?: string;
    newStatus?: string;
  };
  timestamp: string;
  read?: boolean;
}

export interface ActivityFeedProps {
  onTicketClick: (ticket: any) => void;
}

export type ActivityTypeFilter = "ALL" | "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED" | "COMMENT_DELETED" | "TICKET_DELETED" | "TICKET_RESTORED";