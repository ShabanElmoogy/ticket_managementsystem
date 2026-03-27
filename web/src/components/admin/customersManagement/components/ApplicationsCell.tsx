import React from "react";
import { Box, Chip, Typography, useTheme, alpha } from "@mui/material";
import type { CustomerApplication } from "../../../../services/api";

const ApplicationsCell: React.FC<{ apps?: CustomerApplication[] }> = ({ apps }) => {
  const theme = useTheme();

  const getColorForApp = (key: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main,
    ];
    const hash = key
      .split("")
      .reduce((acc, ch) => (((acc << 5) - acc) + ch.charCodeAt(0)) | 0, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  if (!apps || apps.length === 0) return <Typography variant="body2">-</Typography>;

  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 1 }}>
      {apps.map((ca) => {
        const label = ca.application?.name || "Application";
        const key = ca.applicationId || ca.application?.id || label;
        const color = getColorForApp(key);
        return (
          <Chip
            key={ca.applicationId}
            label={label}
            size="small"
            variant="outlined"
            sx={{
              borderColor: alpha(color, 0.5),
              color,
              backgroundColor: alpha(
                color,
                theme.palette.mode === "dark" ? 0.12 : 0.08
              ),
              fontWeight: 600,
            }}
          />
        );
      })}
    </Box>
  );
};

export default ApplicationsCell;
