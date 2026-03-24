import React, { useState } from "react";
import {
  Box,
  Slide,
  Collapse,
  Typography,
  IconButton,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { ActivityBadge } from "./ActivityBadge";
import { ActivityTitle } from "./ActivityTitle";
import { ActivityHeaderActions } from "./ActivityHeaderActions";
import { ActivityFilterChips } from "./ActivityFilterChips";

interface ActivityHeaderProps {
  expanded: boolean;
  unreadCount: number;
  typeFilter: string;
  activities?: any[];
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
  activities = [],
  onToggleExpanded,
  onClearAll,
  onTypeFilterChange,
  onMarkAllRead,
  onMarkAllUnread,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

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
          {/* Filter toggle row */}
          <Box
            onClick={() => setFiltersOpen((v) => !v)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1,
              cursor: "pointer",
              userSelect: "none",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Filter by Activity Type</Typography>
            </Box>
            <IconButton size="small" sx={{ p: 0.25, transition: "transform 0.2s", transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Box>
          <Collapse in={filtersOpen}>
            <Box sx={{ px: 2, pb: 2 }}>
              <ActivityFilterChips
                typeFilter={typeFilter}
                onTypeFilterChange={onTypeFilterChange}
                activities={activities}
              />
            </Box>
          </Collapse>
        </Box>
      </Slide>
    </>
  );
};