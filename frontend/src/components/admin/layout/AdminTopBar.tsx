import React from "react";
import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import { Menu as MenuIcon, Home as HomeIcon } from "@mui/icons-material";

export interface AdminTopBarProps {
  title: string;
  userEmail?: string;
  drawerWidth?: number;
  desktopOpen?: boolean;
  onMobileToggle?: () => void;
  onDesktopToggle?: () => void;
  onHome?: () => void;
}

const DEFAULT_DRAWER_WIDTH = 240;

const AdminTopBar: React.FC<AdminTopBarProps> = ({
  title,
  userEmail,
  drawerWidth = DEFAULT_DRAWER_WIDTH,
  desktopOpen = true,
  onMobileToggle,
  onDesktopToggle,
  onHome,
}) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : "100%" },
        ml: { md: desktopOpen ? `${drawerWidth}px` : 0 },
      }}
    >
      <Toolbar>
        {/* Mobile menu toggle */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMobileToggle}
          sx={{ mr: 2, display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Desktop drawer toggle */}
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={onDesktopToggle}
          sx={{ mr: 2, display: { xs: "none", md: "inline-flex" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Title */}
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        {/* Email + Home */}
        <Typography variant="body2" sx={{ mr: 1 }}>
          {userEmail ? `Welcome, ${userEmail}` : ""}
        </Typography>
        <IconButton color="inherit" aria-label="home" onClick={onHome}>
          <HomeIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default AdminTopBar;
