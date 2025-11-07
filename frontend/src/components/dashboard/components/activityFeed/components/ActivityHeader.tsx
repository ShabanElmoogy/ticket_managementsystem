import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

interface ActivityHeaderProps {
  expanded: boolean;
  unreadCount: number;
  typeFilter: string;
  onToggleExpanded: () => void;
  onClearAll: () => void;
  onTypeFilterChange: (filter: string) => void;
}

export const ActivityHeader: React.FC<ActivityHeaderProps> = ({
  expanded,
  unreadCount,
  typeFilter,
  onToggleExpanded,
  onClearAll,
  onTypeFilterChange,
}) => {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          cursor: "pointer",
        }}
        onClick={onToggleExpanded}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Badge badgeContent={unreadCount} color="primary">
            <NotificationsIcon />
          </Badge>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Activity Feed
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="Clear all">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      {expanded && (
        <Box sx={{ p: 1, borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {["ALL", "TICKET_ASSIGNED", "TICKET_CREATED", "COMMENT_ADDED"].map((filter) => (
              <Chip
                key={filter}
                label={filter.replace("_", " ")}
                size="small"
                variant={typeFilter === filter ? "filled" : "outlined"}
                onClick={() => onTypeFilterChange(filter)}
                sx={{ fontSize: "0.75rem" }}
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
};