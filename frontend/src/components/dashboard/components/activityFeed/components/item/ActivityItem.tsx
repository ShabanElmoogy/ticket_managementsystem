import React from "react";
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  ListItemButton,
  CircularProgress,
  Chip,
  Box,
  Fade,
  Tooltip,
  IconButton,
  Typography,
} from "@mui/material";
import {
  ActivityIcon
} from "../shared/ActivityIcon";
import {
  CheckCircle as ReadIcon,
  RadioButtonChecked as UnreadCheckedIcon,
} from "@mui/icons-material";
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
  onMarkAsRead?: (activityId: string) => void;
  onMarkAsUnread?: (activityId: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  onClick,
  isClicking,
  onMarkAsRead,
  onMarkAsUnread,
}) => {
  const { getTypePalette, getActivityMessage, formatTime } = useActivityUtils();
  const palette = getTypePalette(activity.type);
  const message = getActivityMessage(activity);

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "error";
      case "medium": return "warning";
      case "low": return "success";
      default: return "default";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "open": return "success";
      case "in_progress": return "warning";
      case "closed": return "error";
      case "resolved": return "info";
      default: return "default";
    }
  };

  return (
    <Fade in timeout={300}>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => onClick(activity)}
          disabled={!activity.data.ticket?.id || isClicking}
          sx={{
            py: 1.5,
            px: 2,
            opacity: activity.read ? 0.7 : 1,
            transition: "all 0.3s ease",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: activity.read ? "transparent" : palette.accent,
              borderRadius: "0 4px 4px 0",
              transition: "all 0.3s ease",
            },
            "&:hover": {
              backgroundColor: "action.hover",
              transform: "translateX(4px)",
              boxShadow: (theme) => theme.shadows[1],
              "&::before": {
                width: 6,
              },
            },
          }}
        >
          <ListItemAvatar sx={{ minWidth: 48 }}>
            <Avatar
              sx={{
                bgcolor: palette.accent,
                width: 40,
                height: 40,
                transition: "all 0.3s ease",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              {isClicking ? (
                <CircularProgress size={20} sx={{ color: palette.iconOnAccent }} />
              ) : (
                <ActivityIcon type={activity.type} />
              )}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: activity.read ? 500 : 600,
                    fontSize: "0.875rem",
                    lineHeight: 1.3,
                    flex: 1,
                  }}
                >
                  {message.primary}
                </Typography>
                {!activity.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: palette.accent,
                      animation: "pulse 2s infinite",
                      "@keyframes pulse": {
                        "0%": { opacity: 1, transform: "scale(1)" },
                        "50%": { opacity: 0.5, transform: "scale(1.2)" },
                        "100%": { opacity: 1, transform: "scale(1)" },
                      },
                    }}
                  />
                )}
              </Box>
            }
            secondary={
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box
                  component="span"
                  sx={{
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    lineHeight: 1.4
                  }}
                >
                  {message.secondary} • {formatTime(activity.timestamp)}
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {activity.data.ticket?.priority && (
                    <Chip
                      label={activity.data.ticket.priority}
                      size="small"
                      color={getPriorityColor(activity.data.ticket.priority) as any}
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.65rem", fontWeight: 500 }}
                    />
                  )}
                  {activity.data.ticket?.status && (
                    <Chip
                      label={activity.data.ticket.status.replace("_", " ")}
                      size="small"
                      color={getStatusColor(activity.data.ticket.status) as any}
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.65rem", fontWeight: 500 }}
                    />
                  )}
                </Box>
              </Box>
            }
          />
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {onMarkAsRead && !activity.read && (
              <Tooltip title="Mark as read">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(activity.id);
                  }}
                  sx={{
                    opacity: 0,
                    transition: "all 0.3s ease",
                    ".MuiListItemButton-root:hover &": { opacity: 1 },
                    "&:hover": {
                      color: "success.main",
                      backgroundColor: "success.main",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <ReadIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {onMarkAsUnread && activity.read && (
              <Tooltip title="Mark as unread">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsUnread(activity.id);
                  }}
                  sx={{
                    opacity: 0,
                    transition: "all 0.3s ease",
                    ".MuiListItemButton-root:hover &": { opacity: 1 },
                    "&:hover": {
                      color: "warning.main",
                      backgroundColor: "warning.main",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <UnreadCheckedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </ListItemButton>
      </ListItem>
    </Fade>
  );
};