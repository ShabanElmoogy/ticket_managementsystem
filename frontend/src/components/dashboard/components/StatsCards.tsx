// StatsCards.tsx - Mobile Optimized Container
import React from "react";
import { Card, CardContent, Box, Fade, useTheme } from "@mui/material";
import { type StatsCardsProps } from "../../../types/dashboard";
import { CreateStatItems } from "../../../config/statItems";
import DashboardHeader from "../../common/DashboardHeader";
import ActiveFiltersDisplay from "../statscards/ActiveFiltersDisplay";
import StatCard from "../../common/StatCard";

const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  isFiltered = false,
  activeFilters,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Create stat items and ensure ALL have percentage
  const statItems = CreateStatItems(stats).map((item) => {
    if (item.percentage === undefined) {
      return {
        ...item,
        percentage:
          stats.totalTickets > 0 ? (item.value / stats.totalTickets) * 100 : 0,
      };
    }
    return item;
  });

  return (
    <Fade in={true} timeout={300}>
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          width: "100%",
          overflow: "hidden", // Prevent card overflow
        }}
      >
        <CardContent
          sx={{
            p: { xs: 1, sm: 3 }, // Reduced padding on mobile
            "&:last-child": {
              pb: { xs: 1, sm: 3 }, // Override MUI default last-child padding
            },
          }}
        >
          <Box mb={{ xs: 1, sm: 3 }}>
            {" "}
            {/* Reduced margin on mobile */}
            <DashboardHeader isFiltered={isFiltered} />
            {isFiltered && activeFilters && (
              <ActiveFiltersDisplay
                activeFilters={activeFilters}
                isDarkMode={isDarkMode}
              />
            )}
          </Box>

          {/* Mobile-First Flexbox Layout */}
          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: { xs: "row", sm: "row" }, // Always row layout
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              minHeight: { xs: "120px", sm: "180px" }, // Increased minimum height to match StatCard
            }}
          >
            {statItems.map((item, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  minWidth: 0, // Important: allows flex items to shrink below content size
                  display: "flex",
                  // Responsive borders
                  borderRight: index < statItems.length - 1 ? 1 : 0,
                  borderColor: "divider",
                }}
              >
                <StatCard
                  item={item}
                  index={index}
                  totalItems={statItems.length}
                  isDarkMode={isDarkMode}
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default StatsCards;
