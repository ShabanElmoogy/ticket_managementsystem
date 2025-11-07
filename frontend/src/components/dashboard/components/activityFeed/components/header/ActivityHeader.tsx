import React from "react";
import {
  Box,
  Slide,
} from "@mui/material";
import { ActivityBadge } from "./ActivityBadge";
import { ActivityTitle } from "./ActivityTitle";
import { ActivityHeaderActions } from "./ActivityHeaderActions";
import { ActivityFilterChips } from "./ActivityFilterChips";

interface ActivityHeaderProps {
  expanded: boolean;
  unreadCount: number;
  typeFilter: string;
  onToggleExpanded: () => void;
  onClearAll: () => void;
  onTypeFilterChange: (filter: string) => void;
  onMarkAllRead?: () => void;
  onMarkAllUnread?: () => void;
}

export const ActivityHeader: React.FC<ActivityHeaderProps> = ({
  expanded,
  unreadCount,
  typeFilter,
  onToggleExpanded,
  onClearAll,
  onTypeFilterChange,
  onMarkAllRead,
  onMarkAllUnread,
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
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
          transition: "all 0.3s ease",
          "&:hover": {
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.action.hover} 0%, ${theme.palette.background.paper} 100%)`,
            transform: "translateY(-1px)",
            boxShadow: (theme) => theme.shadows[2],
          },
        }}
        onClick={onToggleExpanded}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ActivityBadge unreadCount={unreadCount} />
          <ActivityTitle unreadCount={unreadCount} />
        </Box>
        <ActivityHeaderActions
          onMarkAllRead={onMarkAllRead}
          onMarkAllUnread={onMarkAllUnread}
          onClearAll={onClearAll}
          expanded={expanded}
        />
      </Box>
      <Slide direction="down" in={expanded} mountOnEnter unmountOnExit>
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 20%, ${theme.palette.background.paper} 100%)`,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: (theme) =>
                `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.success.main}, ${theme.palette.warning.main})`,
            },
          }}
        >
          <ActivityFilterChips
            typeFilter={typeFilter}
            onTypeFilterChange={onTypeFilterChange}
          />
        </Box>
      </Slide>
    </>
  );
};