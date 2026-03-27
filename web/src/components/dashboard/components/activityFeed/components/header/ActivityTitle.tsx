import React from "react";
import {
  Box,
  Typography,
} from "@mui/material";

interface ActivityTitleProps {
  unreadCount: number;
}

export const ActivityTitle: React.FC<ActivityTitleProps> = ({
  unreadCount,
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        Activity Feed
      </Typography>
      {unreadCount > 0 && (
        <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
          {unreadCount} new {unreadCount === 1 ? "activity" : "activities"}
        </Typography>
      )}
    </Box>
  );
};