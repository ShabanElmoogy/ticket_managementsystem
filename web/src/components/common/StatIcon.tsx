// StatIcon.tsx - Mobile Optimized
import React from "react";
import { Box } from "@mui/material";

interface StatIconProps {
  icon: React.ComponentType<any>;
  gradient: string;
  color: string;
}

const StatIcon: React.FC<StatIconProps> = ({
  icon: IconComponent,
  gradient,
  color,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mb: { xs: 0.25, sm: 1 },
      }}
    >
      <Box
        sx={{
          width: { xs: 24, sm: 48 }, // Smaller on mobile
          height: { xs: 24, sm: 48 }, // Smaller on mobile
          borderRadius: { xs: 1, sm: 2 }, // Smaller border radius on mobile
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0px 4px 12px ${color}30`,
        }}
      >
        <IconComponent sx={{ color: "white", fontSize: { xs: 12, sm: 24 } }} />
      </Box>
    </Box>
  );
};

export default StatIcon;
