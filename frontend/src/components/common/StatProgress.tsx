// components/StatProgress.tsx
import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

interface StatProgressProps {
  percentage?: number;
  color: string;
  gradient: string;
}

const StatProgress: React.FC<StatProgressProps> = ({
  percentage,
  color,
  gradient,
}) => {
  return (
    <Box
      sx={{
        mt: { xs: 0.5, sm: 1 },
        mb: { xs: 1, sm: 1.5 },
        minHeight: { xs: "24px", sm: "32px" },
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {percentage !== undefined ? (
        <>
          <Typography
            variant="caption"
            sx={{
              color: color,
              fontWeight: 600,
              mb: { xs: 0.25, sm: 0.5 },
              display: "block",
              fontSize: { xs: "0.6rem", sm: "0.75rem", md: "0.9rem" },
            }}
          >
            {percentage.toFixed(1)}%
          </Typography>

          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: { xs: 3, sm: 6 },
              borderRadius: 3,
              backgroundColor: `${color}20`,
              "& .MuiLinearProgress-bar": {
                borderRadius: 3,
                background: gradient,
              },
            }}
          />
        </>
      ) : (
        <Box sx={{ height: { xs: "16px", sm: "24px" } }} />
      )}
    </Box>
  );
};

export default StatProgress;
