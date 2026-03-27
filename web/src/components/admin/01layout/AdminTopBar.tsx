import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Chip, Tooltip } from "@mui/material";
import { Menu as MenuIcon, Home as HomeIcon } from "@mui/icons-material";
import BlockIcon from "@mui/icons-material/Block";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTenantStatus } from "../../../stores";

export interface AdminTopBarProps {
  title: string;
  userEmail?: string;
  drawerWidth?: number;
  desktopOpen?: boolean;
  onMobileToggle?: () => void;
  onDesktopToggle?: () => void;
  onHome?: () => void;
}

const STATUS_BADGE: Record<string, { label: string; color: 'error' | 'warning'; icon: React.ReactElement; tooltip: string }> = {
  SUSPENDED: { label: 'Suspended',   color: 'error',   icon: <BlockIcon sx={{ fontSize: '16px !important' }} />,       tooltip: 'Account suspended — read-only mode. Contact your administrator.' },
  PAST_DUE:  { label: 'Payment Due', color: 'warning', icon: <ErrorOutlineIcon sx={{ fontSize: '16px !important' }} />, tooltip: 'Payment past due — read-only mode. Please update your billing.' },
  EXPIRED:   { label: 'Expired',     color: 'warning', icon: <AccessTimeIcon sx={{ fontSize: '16px !important' }} />,   tooltip: 'Subscription expired — read-only mode. Contact your administrator.' },
};

const STATUS_MESSAGES: Record<string, string> = {
  PAST_DUE: 'Your subscription is past due. You can view data but cannot create, edit, or delete anything.',
  EXPIRED:  'Your subscription has expired. You can view data but cannot create, edit, or delete anything.',
};


const AdminTopBar: React.FC<AdminTopBarProps> = ({
  title,
  userEmail,
  drawerWidth = DEFAULT_DRAWER_WIDTH,
  desktopOpen = true,
  onMobileToggle,
  onDesktopToggle,
  onHome,
}) => {
  const tenantStatus = useTenantStatus();
  const badge = tenantStatus ? STATUS_BADGE[tenantStatus] : null;
  const centerMessage = tenantStatus ? STATUS_MESSAGES[tenantStatus] ?? null : null;

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : "100%" },
        ml: { md: desktopOpen ? `${drawerWidth}px` : 0 },
      }}
    >
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onMobileToggle} sx={{ mr: 2, display: { md: "none" } }}>
          <MenuIcon />
        </IconButton>

        <IconButton color="inherit" edge="start" onClick={onDesktopToggle} sx={{ mr: 2, display: { xs: "none", md: "inline-flex" } }}>
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        {/* Centered status message for PAST_DUE / EXPIRED */}
        {centerMessage && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'warning.light',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {centerMessage}
          </Typography>
        )}

        {/* Status badge */}
        {badge && (
          <Tooltip title={badge.tooltip}>
            <Chip
              icon={badge.icon}
              label={badge.label}
              color={badge.color}
              size="small"
              sx={{ fontWeight: 700, cursor: 'default', mr: 1 }}
            />
          </Tooltip>
        )}

        <Typography variant="body2" sx={{ mr: 1 }}>
          {userEmail ? `Welcome, ${userEmail}` : ""}
        </Typography>
        <IconButton color="inherit" onClick={onHome}>
          <HomeIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default AdminTopBar;
