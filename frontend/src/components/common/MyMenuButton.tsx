import React from "react";
import { Box, IconButton } from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";

// Props interface
interface MyMenuButtonProps {
  /** Function to handle menu click events */
  handleMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Enhanced Menu Button Component with responsive design and theme support
 *
 * @param props - Component props
 * @param props.handleMenuClick - Click handler function for the menu button
 */
const MyMenuButton: React.FC<MyMenuButtonProps> = ({ handleMenuClick }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: { xs: "center", lg: "center" },
        flexShrink: 0,
        width: { xs: "100%", lg: "auto" },
        mt: { xs: 1, sm: 0, lg: 0 },
      }}
    >
      <IconButton
        onClick={handleMenuClick}
        size="small"
        sx={{
          p: { xs: 1.5, sm: 1.5, md: 2, lg: 1 },
          borderRadius: { xs: 3, sm: 3, lg: 2 },
          width: { xs: "100%", sm: "auto", lg: "auto" },
          maxWidth: { xs: "200px", sm: "none" },
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)"
              : "linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.02) 100%)",
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.08)"
            }`,
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 2px 8px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.08)",
            transform: "translateY(-1px) scale(1.02)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 4px 12px rgba(0, 0, 0, 0.4)"
                : "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
          "&:active": {
            transform: "translateY(0) scale(1.01)",
          },
        }}
      >
        <MoreVertIcon
          sx={{
            fontSize: { xs: 20, sm: 20, md: 22, lg: 20 },
            color: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.8)"
                : "rgba(0, 0, 0, 0.7)",
          }}
        />
      </IconButton>
    </Box>
  );
};

export default MyMenuButton;
