import React from "react";
import {
  Box,
  Typography,
  Chip,
  Fade,
} from "@mui/material";

interface ActivityFilterChipsProps {
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
  activities?: any[];
}

export const ActivityFilterChips: React.FC<ActivityFilterChipsProps> = ({
  typeFilter,
  onTypeFilterChange,
  activities = [],
}) => {
  const counts = {
    ALL: activities.length,
    TICKET_ASSIGNED: activities.filter((a) => a.type === "TICKET_ASSIGNED").length,
    TICKET_CREATED: activities.filter((a) => a.type === "TICKET_CREATED").length,
    COMMENT_ADDED: activities.filter((a) => a.type === "COMMENT_ADDED").length,
    COMMENT_DELETED: activities.filter((a) => a.type === "COMMENT_DELETED").length,
    COMMENT_MENTION: activities.filter((a) => a.type === "COMMENT_MENTION").length,
    TICKET_UPDATED: activities.filter((a) => a.type === "TICKET_UPDATED" && a.data?.newStatus !== "DELETED" && a.data?.newStatus !== "RESTORED").length,
    TICKET_DELETED: activities.filter((a) => a.type === "TICKET_UPDATED" && a.data?.newStatus === "DELETED").length,
    TICKET_RESTORED: activities.filter((a) => a.type === "TICKET_UPDATED" && a.data?.newStatus === "RESTORED").length,
  };

  const filterConfigs = [
    {
      key: "ALL",
      label: "All Activities",
      icon: "📋",
      bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[1000]} 100%)`,
      hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.primary.main}15)`,
      badgeColor: '#6b7280',
    },
    {
      key: "TICKET_ASSIGNED",
      label: "Assignments",
      icon: "👤",
      bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.primary.main}10)`,
      hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.primary.light}30, ${theme.palette.primary.main}20)`,
      badgeColor: '#3b82f6',
    },
    {
      key: "TICKET_CREATED",
      label: "New Tickets",
      icon: "🎫",
      bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.success.light}20, ${theme.palette.success.main}10)`,
      hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.success.light}30, ${theme.palette.success.main}20)`,
      badgeColor: '#10b981',
    },
    {
      key: "COMMENT_ADDED",
      label: "Comments",
      icon: "💬",
      bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.secondary.light}20, ${theme.palette.secondary.main}10)`,
      hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.secondary.light}30, ${theme.palette.secondary.main}20)`,
      badgeColor: '#8b5cf6',
    },
    {
      key: "COMMENT_MENTION",
      label: "Mentions",
      icon: "@",
      bgColor: () => `linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.08))`,
      hoverColor: () => `linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.15))`,
      badgeColor: '#6366f1',
    },
    {
      key: "COMMENT_DELETED",
      label: "Comment Deleted",
      icon: "🗨️",
      bgColor: () => `linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.05))`,
      hoverColor: () => `linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))`,
      badgeColor: '#f87171',
    },
    {
      key: "TICKET_UPDATED",
      label: "Updated Tickets",
      icon: "✏️",
      bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.warning.light}20, ${theme.palette.warning.main}10)`,
      hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.warning.light}30, ${theme.palette.warning.main}20)`,
      badgeColor: '#f59e0b',
    },
    {
      key: "TICKET_DELETED",
      label: "Deleted Tickets",
      icon: "🗑️",
      bgColor: () => `linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))`,
      hoverColor: () => `linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))`,
      badgeColor: '#ef4444',
    },
    {
      key: "TICKET_RESTORED",
      label: "Restored Tickets",
      icon: "♻️",
      bgColor: () => `linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))`,
      hoverColor: () => `linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))`,
      badgeColor: '#10b981',
    },
  ];

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {filterConfigs.map((filter, index) => (
          <Fade in key={filter.key} timeout={300 + index * 100}>
            <Chip
              label={
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                  <span style={{ fontSize: "14px" }}>{filter.icon}</span>
                  {filter.label}
                  {counts[filter.key as keyof typeof counts] > 0 && (
                    <Box
                      sx={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: '9px',
                        bgcolor: filter.badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 0.5,
                        ml: 0.25,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.6rem', color: '#fff', fontWeight: 800, lineHeight: 1 }}>
                        {counts[filter.key as keyof typeof counts]}
                      </Typography>
                    </Box>
                  )}
                </Box>
              }
              size="small"
              variant={typeFilter === filter.key ? "filled" : "outlined"}
              onClick={() => onTypeFilterChange(filter.key)}
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                px: 1.5,
                py: 0.75,
                borderRadius: "20px",
                width: filter.key === 'ALL' || filter.key === 'COMMENT_DELETED' || filter.key === 'COMMENT_ADDED' || filter.key === 'COMMENT_MENTION' || filter.key === 'TICKET_UPDATED' || filter.key === 'TICKET_DELETED' || filter.key === 'TICKET_RESTORED' ? '100%' : 'calc(50% - 4px)',
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: typeFilter === filter.key
                  ? (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.light}25)`
                  : filter.bgColor,
                border: typeFilter === filter.key
                  ? (theme) => `2px solid ${theme.palette.primary.main}`
                  : "1px solid",
                borderColor: typeFilter === filter.key
                  ? (theme) => theme.palette.primary.main
                  : "divider",
                color: typeFilter === filter.key
                  ? (theme) => theme.palette.primary.contrastText || "white"
                  : (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111827',
                boxShadow: typeFilter === filter.key
                  ? (theme) => `0 2px 8px ${theme.palette.primary.main}30`
                  : "none",
                "&:hover": {
                  transform: "translateY(-2px) scale(1.02)",
                  boxShadow: typeFilter === filter.key
                    ? (theme) => `0 4px 12px ${theme.palette.primary.main}40`
                    : (theme) => theme.shadows[2],
                  background: typeFilter === filter.key
                    ? (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.light}30)`
                    : filter.hoverColor,
                  color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111827',
                  '& .MuiChip-label': { color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111827' },
                },
                "& .MuiChip-label": {
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: (theme: any) => theme.palette.mode === 'dark' ? '#fff' : '#111827',
                },
              }}
            />
          </Fade>
        ))}
      </Box>
  );
};