// StatCard.tsx - Mobile Optimized to Prevent Overflow
import React from "react";
import { Box } from "@mui/material";
import { type StatItem } from "../dashboard/types/types";
import StatIcon from "./StatIcon";
import StatValue from "./StatValue";
import StatProgress from "./StatProgress";

interface StatCardProps {
  item: StatItem;
  index: number;
  totalItems: number;
  isDarkMode?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ item, isDarkMode = false }) => {
  return (
    <Box
      sx={{
        textAlign: "center",
        p: { xs: 1, sm: 3 }, // Reduced padding on mobile
        transition: "all 0.2s ease-in-out",
        height: { xs: "100px", sm: "180px", md: "200px" }, // Reduced height on mobile
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        minWidth: 0, // Allow shrinking
        overflow: "hidden", // Prevent overflow
        "&:hover": {
          backgroundColor: isDarkMode ? `${item.color}15` : `${item.color}05`,
          transform: { xs: "none", sm: "scale(1.02)" }, // Disable hover scale on mobile
          zIndex: 1,
        },
      }}
    >
      <StatIcon icon={item.icon} gradient={item.gradient} color={item.color} />

      <StatValue value={item.value} title={item.title} color={item.color} />

      <StatProgress
        percentage={item.percentage}
        color={item.color}
        gradient={item.gradient}
      />
    </Box>
  );
};

export default StatCard;
