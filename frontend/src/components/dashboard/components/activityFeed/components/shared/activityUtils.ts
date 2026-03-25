import { useTheme } from "@mui/material";
import type { ActivityItem } from "./types";

export const useActivityUtils = () => {
  const theme = useTheme();

  const getTypePalette = (type: string) => {
    const mode = theme.palette.mode;
    const accents = {
      light: {
        CREATED: { accent: "#10b981", iconInline: "#0f766e" },
        UPDATED: { accent: "#f59e0b", iconInline: "#b45309" },
        ASSIGNED: { accent: "#3b82f6", iconInline: "#1d4ed8" },
        COMMENT: { accent: "#8b5cf6", iconInline: "#6d28d9" },
        MUTED: { accent: "#6b7280", iconInline: "#4b5563" },
      },
      dark: {
        CREATED: { accent: "#34d399", iconInline: "#34d399" },
        UPDATED: { accent: "#fbbf24", iconInline: "#fbbf24" },
        ASSIGNED: { accent: "#60a5fa", iconInline: "#60a5fa" },
        COMMENT: { accent: "#a78bfa", iconInline: "#a78bfa" },
        MUTED: { accent: "#9ca3af", iconInline: "#9ca3af" },
      },
    } as const;

    const map = accents[mode === "dark" ? "dark" : "light"];
    const key = type === "TICKET_CREATED" ? "CREATED"
      : type === "TICKET_UPDATED" ? "UPDATED"
      : type === "TICKET_ASSIGNED" ? "ASSIGNED"
      : type === "COMMENT_ADDED" ? "COMMENT"
      : type === "COMMENT_DELETED" ? "COMMENT"
      : "MUTED";

    const accent = map[key].accent;
    const iconOnAccent = theme.palette.getContrastText(accent);
    const iconInline = map[key].iconInline;
    return { accent, iconOnAccent, iconInline };
  };

  const getActivityMessage = (activity: ActivityItem) => {
    const { type } = activity || {};
    const data = (activity && activity.data) || {} as ActivityItem['data'];
    const ticket = data.ticket || { title: "Untitled ticket" };

    switch (type) {
      case "TICKET_CREATED":
        return {
          primary: `New ticket: ${ticket.title || "Untitled ticket"}`,
          secondary: `Created by ${data.createdBy || "Someone"}`,
        };
      case "TICKET_UPDATED":
        return {
          primary: `Ticket updated: ${ticket.title || "Untitled ticket"}`,
          secondary: data.newStatus === 'DELETED'
            ? `Deleted by ${data.updatedBy || "Someone"}`
            : data.newStatus === 'RESTORED'
            ? `Restored by ${data.updatedBy || "Someone"}`
            : data.newStatus
            ? `Status → ${data.newStatus.replace(/_/g, ' ')} by ${data.updatedBy || "Someone"}`
            : `Updated by ${data.updatedBy || "Someone"}`,
        };
      case "TICKET_ASSIGNED":
        return {
          primary: `Ticket assigned: ${ticket.title || "Untitled ticket"}`,
          secondary: data.assignedTo
            ? `Assigned to programmer: ${data.assignedTo}`
            : `Assigned to ${data.assignedTo || "a user"}`,
        };
      case "COMMENT_ADDED":
        return {
          primary: `New comment on: ${ticket.title || "Untitled ticket"}`,
          secondary: `Comment by ${data.commentBy || "Someone"}`,
        };
      case "COMMENT_DELETED":
        return {
          primary: `Comment deleted on: ${ticket.title || "Untitled ticket"}`,
          secondary: `Deleted by ${data.commentBy || "Someone"}`,
        };
      default:
        return { primary: "New activity", secondary: "" };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return { getTypePalette, getActivityMessage, formatTime };
};