// components/header/ThemeToggleButton.tsx
import React from "react";
import { IconButton } from "@mui/material";
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";

interface ThemeToggleButtonProps {
  mode: "light" | "dark";
  onToggle: () => void;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  mode,
  onToggle,
}) => {
  const buttonSize = { width: 40, height: 40 };

  return (
    <IconButton
      size="large"
      onClick={onToggle}
      color="inherit"
      sx={{
        ...buttonSize,
        backgroundColor:
          mode === "light"
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(255, 255, 255, 0.05)",
        "&:hover": {
          backgroundColor:
            mode === "light"
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(255, 255, 255, 0.1)",
        },
        border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
        mr: 1,
      }}
      title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
    >
      {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
};

export default ThemeToggleButton;
