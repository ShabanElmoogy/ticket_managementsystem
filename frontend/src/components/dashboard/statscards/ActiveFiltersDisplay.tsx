// components/ActiveFiltersDisplay.tsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { type ActiveFilters } from "../types/types";
import FilterChip from "../../common/FilterChip";

interface ActiveFiltersDisplayProps {
  activeFilters: ActiveFilters;
  isDarkMode?: boolean;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  activeFilters,
  isDarkMode = false,
}) => {
  const getFilterChips = () => {
    const chips = [];

    if (activeFilters.status) {
      chips.push(
        <FilterChip
          key="status"
          label={`Status: ${activeFilters.status.replace("_", " ")}`}
          emoji="📋"
          color="info"
          backgroundColor={isDarkMode ? "rgba(25, 118, 210, 0.2)" : "#e3f2fd"}
          textColor="#1976d2"
        />
      );
    }

    if (activeFilters.priority) {
      chips.push(
        <FilterChip
          key="priority"
          label={`Priority: ${activeFilters.priority}`}
          emoji="⚡"
          color="warning"
          backgroundColor={isDarkMode ? "rgba(245, 124, 0, 0.2)" : "#fff3e0"}
          textColor="#f57c00"
        />
      );
    }

    if (activeFilters.user && activeFilters.userName) {
      chips.push(
        <FilterChip
          key="user"
          label={`User: ${activeFilters.userName}`}
          emoji="👤"
          color="success"
          backgroundColor={isDarkMode ? "rgba(46, 125, 50, 0.2)" : "#e8f5e8"}
          textColor="#2e7d32"
        />
      );
    }

    if (activeFilters.customer && activeFilters.customerName) {
      chips.push(
        <FilterChip
          key="customer"
          label={`Customer: ${activeFilters.customerName}`}
          emoji="🏢"
          color="primary"
          backgroundColor={isDarkMode ? "rgba(59, 130, 246, 0.2)" : "#dbeafe"}
          textColor="#2563eb"
        />
      );
    }

    if (activeFilters.application && activeFilters.applicationName) {
      chips.push(
        <FilterChip
          key="application"
          label={`App: ${activeFilters.applicationName}`}
          emoji="📱"
          color="success"
          backgroundColor={isDarkMode ? "rgba(16, 185, 129, 0.2)" : "#d1fae5"}
          textColor="#059669"
        />
      );
    }

    return chips;
  };

  const chips = getFilterChips();

  if (chips.length === 0) return null;

  return (
    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ mr: 1, alignSelf: "center" }}
      >
        Active filters:
      </Typography>
      {chips}
    </Box>
  );
};

export default ActiveFiltersDisplay;
