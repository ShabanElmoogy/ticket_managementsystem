// components/header/NotificationBell.tsx
import React from "react";
import { IconButton, Badge, Tooltip } from "@mui/material";
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
} from "@mui/icons-material";

interface NotificationBellProps {
  unreadCount: number;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  mode: "light" | "dark";
  isMobile: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  onClick,
  mode,
  isMobile,
}) => {
  const buttonSize = { width: 40, height: 40 };
  const mobileButtonSize = { width: 36, height: 36 };

  return (
    <Tooltip title="Notifications">
      <IconButton
        size="large"
        onClick={onClick}
        color="inherit"
        sx={{
          ...(!isMobile ? buttonSize : mobileButtonSize),
          backgroundColor:
            mode === "light"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.05)",
          "&:hover": {
            backgroundColor:
              mode === "light"
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(255, 255, 255, 0.1)",
          },
          border:
            mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          mr: { xs: 0.5, sm: 1 },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.75rem",
              minWidth: "18px",
              height: "18px",
              animation: unreadCount > 0 ? "pulse 2s infinite" : "none",
            },
            "@keyframes pulse": {
              "0%": { transform: "scale(1)" },
              "50%": { transform: "scale(1.1)" },
              "100%": { transform: "scale(1)" },
            },
          }}
        >
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default NotificationBell;
