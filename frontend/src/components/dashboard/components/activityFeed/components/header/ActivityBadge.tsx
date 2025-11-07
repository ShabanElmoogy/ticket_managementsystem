import React from "react";
import {
  Badge,
  Box,
  Typography,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
} from "@mui/icons-material";

interface ActivityBadgeProps {
  unreadCount: number;
}

export const ActivityBadge: React.FC<ActivityBadgeProps> = ({
  unreadCount,
}) => {
  return (
    <Badge
      badgeContent={unreadCount}
      color="primary"
      sx={{
        "& .MuiBadge-badge": {
          animation: unreadCount > 0 ? "pulse 2s infinite" : "none",
          "@keyframes pulse": {
            "0%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.2)" },
            "100%": { transform: "scale(1)" },
          },
        },
      }}
    >
      <NotificationsIcon sx={{ fontSize: 28 }} />
    </Badge>
  );
};