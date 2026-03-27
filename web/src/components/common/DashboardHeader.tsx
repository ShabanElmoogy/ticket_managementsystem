// components/DashboardHeader.tsx
import React from "react";
import { Box, Typography, Chip } from "@mui/material";

interface DashboardHeaderProps {
  isFiltered?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isFiltered = false,
}) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
        📊 Dashboard Overview
      </Typography>
      {isFiltered && (
        <Chip
          label="Filtered Results"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      )}
    </Box>
  );
};

export default DashboardHeader;
