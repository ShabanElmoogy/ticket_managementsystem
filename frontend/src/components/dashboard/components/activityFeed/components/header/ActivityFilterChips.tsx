import React from "react";
import {
  Box,
  Typography,
  Chip,
  Fade,
} from "@mui/material";
import {
  FilterList as FilterIcon,
} from "@mui/icons-material";

interface ActivityFilterChipsProps {
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
}

export const ActivityFilterChips: React.FC<ActivityFilterChipsProps> = ({
  typeFilter,
  onTypeFilterChange,
}) => {
  const filterConfigs = [
    {
      key: "ALL",
      label: "All Activities",
      color: "default",
      icon: "📋",
      bgColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[1000]} 100%)`,
      hoverColor: (theme: any) => `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.grey[200]} 100%)`,
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
  ];

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <FilterIcon sx={{ fontSize: 20, color: "primary.main" }} />
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
          Filter by Activity Type
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {filterConfigs.map((filter, index) => (
          <Fade in key={filter.key} timeout={300 + index * 100}>
            <Chip
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <span style={{ fontSize: "14px" }}>{filter.icon}</span>
                  {filter.label}
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
                  : "text.primary",
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
    </>
  );
};