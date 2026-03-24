// components/header/NotificationItem.tsx
import React from "react";
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  Update as UpdateIcon,
  Clear as ClearIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
} from "@mui/icons-material";
import { type Notification } from "../../../types/header";

interface NotificationItemProps {
  notification: Notification;
  onItemClick: (notification: Notification) => void;
  onRemove: (id: string) => void;
  formatTime: (timestamp: string) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onItemClick,
  onRemove,
  formatTime,
}) => {
  const newStatus = notification.data?.newStatus;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TICKET_CREATED":
        return <AssignmentIcon sx={{ color: "#10b981" }} />;
      case "TICKET_UPDATED":
        if (newStatus === "DELETED") return <DeleteIcon sx={{ color: "#ef4444" }} />;
        if (newStatus === "RESTORED") return <RestoreIcon sx={{ color: "#10b981" }} />;
        return <UpdateIcon sx={{ color: "#f59e0b" }} />;
      case "TICKET_ASSIGNED":
        return <AssignmentIcon sx={{ color: "#3b82f6" }} />;
      case "COMMENT_ADDED":
        return <CommentIcon sx={{ color: "#8b5cf6" }} />;
      case "TICKET_DUE_SOON":
        return <ScheduleIcon sx={{ color: "#f59e0b" }} />;
      case "TICKET_OVERDUE":
        return <ErrorIcon sx={{ color: "#ef4444" }} />;
      case "STATUS_CHANGED":
        return <UpdateIcon sx={{ color: "#06b6d4" }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "TICKET_CREATED":
        return "#10b981";
      case "TICKET_UPDATED":
        if (newStatus === "DELETED") return "#ef4444";
        if (newStatus === "RESTORED") return "#10b981";
        return "#f59e0b";
      case "TICKET_ASSIGNED":
        return "#3b82f6";
      case "COMMENT_ADDED":
        return "#8b5cf6";
      case "TICKET_DUE_SOON":
        return "#f59e0b";
      case "TICKET_OVERDUE":
        return "#ef4444";
      case "STATUS_CHANGED":
        return "#06b6d4";
      default:
        return "#6b7280";
    }
  };

  const hasTicketData = notification.data?.ticket?.id;

  return (
    <Tooltip
      title={hasTicketData ? "Click to view ticket details" : ""}
      placement="left"
      arrow
    >
      <ListItem
        component={hasTicketData ? "button" : "div"}
        onClick={hasTicketData ? () => onItemClick(notification) : undefined}
        sx={{
          py: 1.5,
          px: 2,
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          backgroundColor: notification.read ? "transparent" : "action.hover",
          borderLeft: notification.read ? "none" : "4px solid",
          borderLeftColor: notification.read
            ? "transparent"
            : getNotificationColor(notification.type),
          cursor: hasTicketData ? "pointer" : "default",
          "&:hover": hasTicketData
            ? {
                backgroundColor: notification.read
                  ? "action.hover"
                  : "action.selected",
                transform: "translateX(2px)",
              }
            : {},
          transition: "all 0.2s ease-in-out",
          position: "relative",
          "&::after": hasTicketData
            ? {
                content: '""',
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 0,
                height: 0,
                borderLeft: "4px solid",
                borderTop: "4px solid transparent",
                borderBottom: "4px solid transparent",
                borderColor: "text.secondary",
                opacity: 0.5,
              }
            : {},
        }}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: getNotificationColor(notification.type),
            }}
          >
            {getNotificationIcon(notification.type)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          sx={{
            overflow: "hidden",
            pr: hasTicketData ? 3 : 1,
          }}
          primary={
            <Typography
              variant="body2"
              sx={{
                fontWeight: notification.read ? 400 : 600,
                mb: 0.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {notification.title}
            </Typography>
          }
          secondary={
            <Box sx={{ overflow: "hidden", maxWidth: "100%" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mb: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {notification.message}
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {formatTime(notification.timestamp)}
              </Typography>
            </Box>
          }
        />
        <ListItemSecondaryAction
          sx={{
            right: hasTicketData ? 24 : 8,
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(notification.id);
            }}
            sx={{
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </Tooltip>
  );
};

export default NotificationItem;
