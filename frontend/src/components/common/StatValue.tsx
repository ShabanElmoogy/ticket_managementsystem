// StatValue.tsx - Mobile Optimized
import React from "react";
import { Box, Typography } from "@mui/material";

interface StatValueProps {
  value: number;
  title: string;
  color: string;
}

const StatValue: React.FC<StatValueProps> = ({ value, title, color }) => {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          color: color,
          fontWeight: 700,
          lineHeight: 1,
          mb: { xs: 0.25, sm: 1 },
          fontSize: { xs: "1rem", sm: "2.125rem" }, // Smaller font on mobile
        }}
      >
        {value}
      </Typography>

      <Typography
        variant="body2"
        color="textSecondary"
        sx={{
          fontWeight: 600,
          fontSize: { xs: "0.5rem", sm: "0.7rem", md: "1rem" }, // Smaller font on mobile
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap", // Prevent text wrapping on mobile
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default StatValue;
