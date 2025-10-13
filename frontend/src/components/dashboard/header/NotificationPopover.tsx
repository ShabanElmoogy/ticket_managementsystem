// components/header/NotificationPopover.tsx
import React from "react";
import {
  Popover,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  List,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  NotificationsNone as NotificationsNoneIcon,
} from "@mui/icons-material";
import { type Notification } from "../../../types/header";
import NotificationItem from "./NotificationItem";

interface NotificationPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onClearAll: () => void;
  onMarkAllAsRead: () => void;
  onRemoveNotification: (id: string) => void;
  onNotificationItemClick: (notification: Notification) => void;
  formatTime: (timestamp: string) => string;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  open,
  anchorEl,
  onClose,
  notifications,
  unreadCount,
  loading,
  onClearAll,
  onMarkAllAsRead,
  onRemoveNotification,
  onNotificationItemClick,
  formatTime,
}) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          width: { xs: "90vw", sm: 400 },
          maxWidth: 400,
          maxHeight: 500,
          borderRadius: 2,
          boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)",
          mt: 1,
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{ ml: 1, fontSize: "0.75rem" }}
              />
            )}
          </Typography>
          <Box>
            {notifications.length > 0 && (
              <Tooltip title="Clear all">
                <IconButton size="small" onClick={onClearAll}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={onMarkAllAsRead}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          maxHeight: 400,
          overflow: "auto",
          overflowX: "hidden",
          width: "100%",
        }}
      >
        {loading ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Loading notifications...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">No notifications yet</Typography>
            <Typography variant="caption" color="text.disabled">
              You'll see updates about tickets here
            </Typography>
          </Box>
        ) : (
          <List
            sx={{
              p: 0,
              width: "100%",
              overflow: "hidden",
            }}
          >
            {notifications
              .map((notification, index) => [
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onItemClick={onNotificationItemClick}
                  onRemove={onRemoveNotification}
                  formatTime={formatTime}
                />,
                index < notifications.length - 1 && (
                  <Divider
                    key={`divider-${notification.id}`}
                    variant="inset"
                    component="li"
                  />
                ),
              ])
              .flat()
              .filter(Boolean)}
          </List>
        )}
      </Box>
    </Popover>
  );
};

export default NotificationPopover;
