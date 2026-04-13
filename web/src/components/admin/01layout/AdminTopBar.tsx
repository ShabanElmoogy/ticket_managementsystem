import React from 'react';
import {
  AppBar, Toolbar, Typography, IconButton,
  Chip, Tooltip, Box, Avatar, useTheme,
} from '@mui/material';
import { Menu as MenuIcon, Home as HomeIcon } from '@mui/icons-material';
import BlockIcon from '@mui/icons-material/Block';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTenantStatus } from '../../../stores';

const DEFAULT_DRAWER_WIDTH = 240;

export interface AdminTopBarProps {
  title: string;
  userEmail?: string;
  userName?: string;
  drawerWidth?: number;
  desktopOpen?: boolean;
  onMobileToggle?: () => void;
  onDesktopToggle?: () => void;
  onHome?: () => void;
}

const STATUS_BADGE: Record<string, {
  label: string;
  color: 'error' | 'warning';
  icon: React.ReactElement;
  tooltip: string;
}> = {
  SUSPENDED: {
    label: 'Suspended',
    color: 'error',
    icon: <BlockIcon sx={{ fontSize: '16px !important' }} />,
    tooltip: 'Account suspended — read-only mode. Contact your administrator.',
  },
  PAST_DUE: {
    label: 'Payment Due',
    color: 'warning',
    icon: <ErrorOutlineIcon sx={{ fontSize: '16px !important' }} />,
    tooltip: 'Payment past due — read-only mode. Please update your billing.',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'warning',
    icon: <AccessTimeIcon sx={{ fontSize: '16px !important' }} />,
    tooltip: 'Subscription expired — read-only mode. Contact your administrator.',
  },
};

const STATUS_MESSAGES: Record<string, string> = {
  PAST_DUE: 'Subscription past due — view only.',
  EXPIRED:  'Subscription expired — view only.',
};

const AdminTopBar: React.FC<AdminTopBarProps> = ({
  title,
  userEmail,
  userName,
  drawerWidth = DEFAULT_DRAWER_WIDTH,
  desktopOpen = true,
  onMobileToggle,
  onDesktopToggle,
  onHome,
}) => {
  const theme = useTheme();
  const tenantStatus = useTenantStatus();
  const badge = tenantStatus ? STATUS_BADGE[tenantStatus] ?? null : null;
  const centerMessage = tenantStatus ? STATUS_MESSAGES[tenantStatus] ?? null : null;

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? '?';

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
        ml:    { md: desktopOpen ? `${drawerWidth}px` : 0 },
        transition: theme.transitions.create(['width', 'margin'], {
          easing: desktopOpen ? theme.transitions.easing.easeOut : theme.transitions.easing.sharp,
          duration: desktopOpen
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {/* Mobile menu toggle */}
        <IconButton
          color="inherit" edge="start"
          onClick={onMobileToggle}
          sx={{ display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Desktop sidebar toggle */}
        <IconButton
          color="inherit" edge="start"
          onClick={onDesktopToggle}
          sx={{ display: { xs: 'none', md: 'inline-flex' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Page title */}
        <Typography variant="h6" noWrap fontWeight={600} sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        {/* Centered status message — hidden on xs to avoid overflow */}
        {centerMessage && (
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: { xs: 'none', sm: 'block' },
              pointerEvents: 'none',
            }}
          >
            <Typography variant="caption" sx={{ color: 'warning.light', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {centerMessage}
            </Typography>
          </Box>
        )}

        {/* Status badge */}
        {badge && (
          <Tooltip title={badge.tooltip}>
            <Chip
              icon={badge.icon}
              label={badge.label}
              color={badge.color}
              size="small"
              sx={{ fontWeight: 700, cursor: 'default' }}
            />
          </Tooltip>
        )}

        {/* User avatar */}
        {(userName || userEmail) && (
          <Tooltip title={userName ?? userEmail ?? ''}>
            <Avatar
              sx={{
                width: 32, height: 32,
                fontSize: '0.75rem', fontWeight: 700,
                bgcolor: 'primary.dark',
                cursor: 'default',
              }}
            >
              {initials}
            </Avatar>
          </Tooltip>
        )}

        {/* Home */}
        <Tooltip title="Back to Dashboard">
          <IconButton color="inherit" onClick={onHome} size="small">
            <HomeIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default AdminTopBar;
