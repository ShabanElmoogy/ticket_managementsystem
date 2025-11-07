import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  Chip,
  Fade,
  Slide,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
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
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Clear all activities">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              sx={{
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "error.main",
                  color: "error.contrastText",
                  transform: "scale(1.1)",
                },
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            sx={{
              transition: "transform 0.3s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <FilterIcon sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
              Filter by Activity Type
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[
              {
                key: "ALL",
                label: "All Activities",
                color: "default",
                icon: "📋",
                bgColor: (theme: any) => theme.palette.grey[100],
                hoverColor: (theme: any) => theme.palette.grey[200],
              },
              {
                key: "TICKET_ASSIGNED",
                label: "Assignments",
                color: "primary",
                icon: "👤",
                bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.primary.main}10)`,
                hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.primary.light}30, ${theme.palette.primary.main}20)`,
              },
              {
                key: "TICKET_CREATED",
                label: "New Tickets",
                color: "success",
                icon: "🎫",
                bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.success.light}20, ${theme.palette.success.main}10)`,
                hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.success.light}30, ${theme.palette.success.main}20)`,
              },
              {
                key: "COMMENT_ADDED",
                label: "Comments",
                color: "secondary",
                icon: "💬",
                bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.secondary.light}20, ${theme.palette.secondary.main}10)`,
                hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.secondary.light}30, ${theme.palette.secondary.main}20)`,
              },
            ].map((filter, index) => (
              <Fade in key={filter.key} timeout={300 + index * 100}>
                <Chip
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <span style={{ fontSize: "14px" }}>{filter.icon}</span>
                      {filter.label}
                    </Box>
                  }
                  size="small"
                  color={typeFilter === filter.key ? filter.color as any : "default"}
                  variant={typeFilter === filter.key ? "filled" : "outlined"}
                  onClick={() => onTypeFilterChange(filter.key)}
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "20px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: typeFilter === filter.key
                      ? (theme) => `linear-gradient(135deg, ${theme.palette[filter.color as any]?.main}15, ${theme.palette[filter.color as any]?.light}25)`
                      : filter.bgColor,
                    border: typeFilter === filter.key
                      ? (theme) => `2px solid ${theme.palette[filter.color as any]?.main}`
                      : "1px solid",
                    borderColor: typeFilter === filter.key
                      ? (theme) => theme.palette[filter.color as any]?.main
                      : "divider",
                    color: typeFilter === filter.key
                      ? (theme) => theme.palette[filter.color as any]?.main
                      : "text.primary",
                    boxShadow: typeFilter === filter.key
                      ? (theme) => `0 2px 8px ${theme.palette[filter.color as any]?.main}30`
                      : "none",
                    "&:hover": {
                      transform: "translateY(-2px) scale(1.02)",
                      boxShadow: typeFilter === filter.key
                        ? (theme) => `0 4px 12px ${theme.palette[filter.color as any]?.main}40`
                        : (theme) => theme.shadows[2],
                      background: typeFilter === filter.key
                        ? (theme) => `linear-gradient(135deg, ${theme.palette[filter.color as any]?.main}20, ${theme.palette[filter.color as any]?.light}30)`
                        : filter.hoverColor,
                    },
                    "& .MuiChip-label": {
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    },
                  }}
                />
              </Fade>
            ))}
          </Box>
        </Box>
      </Slide>
    </>
  );
};