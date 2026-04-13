import React from "react";
import { Chip } from "@mui/material";

export interface AppFilterChipProps {
  label: string;
  emoji: string;
  color: "info" | "warning" | "success" | "primary";
  backgroundColor: string;
  textColor: string;
}

const AppFilterChip: React.FC<AppFilterChipProps> = ({
  label,
  emoji,
  color,
  backgroundColor,
  textColor,
}) => {
  return (
    <Chip
      label={`${emoji} ${label}`}
      size="small"
      color={color}
      variant="filled"
      sx={{
        fontSize: "0.7rem",
        height: 24,
        backgroundColor,
        color: textColor,
        fontWeight: 500,
      }}
    />
  );
};

export default AppFilterChip;

// Legacy alias
export { AppFilterChip as FilterChip };
