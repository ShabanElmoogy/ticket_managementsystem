import React from "react";
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  ListItemButton,
  CircularProgress,
} from "@mui/material";
import { ActivityIcon } from "./ActivityIcon";
import { useTheme } from "@mui/material";
type ActivityItemType = {
  id: string;
  type: "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED";
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    commentBy?: string;
  };
  timestamp: string;
  read?: boolean;
};

const useActivityUtils = () => {
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
    const key = type === "TICKET_CREATED" ? "CREATED" : type === "TICKET_UPDATED" ? "UPDATED" : type === "TICKET_ASSIGNED" ? "ASSIGNED" : type === "COMMENT_ADDED" ? "COMMENT" : "MUTED";
    const accent = map[key].accent;
    const iconOnAccent = theme.palette.getContrastText(accent);
    const iconInline = map[key].iconInline;
    return { accent, iconOnAccent, iconInline };
  };
  const getActivityMessage = (activity: ActivityItemType) => {
    const { type } = activity || {};
    const data = (activity && activity.data) || {} as ActivityItemType['data'];
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
          secondary: `Updated by ${data.updatedBy || "Someone"}`,
        };
      case "TICKET_ASSIGNED":
        return {
          primary: `Ticket assigned: ${ticket.title || "Untitled ticket"}`,
          secondary: `Assigned to ${data.assignedTo || "a user"}`,
        };
      case "COMMENT_ADDED":
        return {
          primary: `New comment on: ${ticket.title || "Untitled ticket"}`,
          secondary: `Comment by ${data.commentBy || "Someone"}`,
        };
      default:
        return { primary: "New activity", secondary: "" };
    }
  };
  const formatTime = (timestamp: string) => {
    const diffInMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    return diffInMinutes < 1 ? "Just now" : `${diffInMinutes}m ago`;
  };
  return { getTypePalette, getActivityMessage, formatTime };
};

interface ActivityItemProps {
  activity: ActivityItemType;
  onClick: (activity: ActivityItemType) => void;
  isClicking: boolean;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  onClick,
  isClicking,
}) => {
  const { getTypePalette, getActivityMessage, formatTime } = useActivityUtils();
  const palette = getTypePalette(activity.type);
  const message = getActivityMessage(activity);

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => onClick(activity)}
        disabled={!activity.data.ticket?.id || isClicking}
        sx={{
          opacity: activity.read ? 0.7 : 1,
          "&:hover": { backgroundColor: "action.hover" },
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: palette.accent, width: 32, height: 32 }}>
            {isClicking ? (
              <CircularProgress size={16} sx={{ color: palette.iconOnAccent }} />
            ) : (
              <ActivityIcon type={activity.type} />
            )}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={message.primary}
          secondary={`${message.secondary} • ${formatTime(activity.timestamp)}`}
          primaryTypographyProps={{
            variant: "body2",
            fontWeight: activity.read ? "normal" : "medium",
          }}
          secondaryTypographyProps={{
            variant: "caption",
            color: "text.secondary",
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};