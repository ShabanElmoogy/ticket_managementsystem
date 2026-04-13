// components/Header.tsx - Main Header Component
import React, { useState } from 'react';
import { AppBar, Toolbar, Box, useTheme, useMediaQuery, Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useTenantStatus } from '../../stores';
import { isTenantAdmin } from '../../types/roles';
import BlockIcon from '@mui/icons-material/Block';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { type HeaderProps } from '../../types/header';
import { createMenuItems } from '../../config/menuItems';

// Component imports
import HeaderLogo from './header/HeaderLogo';
import UserAvatar from './header/UserAvatar';
import LanguageSelector from '../common/layout/AppLanguageSelector';

import ThemeToggleButton from './header/ThemeToggleButton';
import MenuButton from './header/MenuButton';
import DesktopMenu from './header/DesktopMenu';
import MobileDrawer from './header/MobileDrawer';




const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuthStore();
  const tenantStatus = useTenantStatus();
  const showStatusBadge = !!tenantStatus && ['SUSPENDED','PAST_DUE','EXPIRED'].includes(tenantStatus) && isTenantAdmin(user?.role);

  const STATUS_BADGE: Record<string, { label: string; color: 'error' | 'warning'; icon: React.ReactElement; tooltip: string }> = {
    SUSPENDED: { label: 'Suspended',    color: 'error',   icon: <BlockIcon sx={{ fontSize: '16px !important' }} />,       tooltip: 'Account suspended — read-only mode. Contact your administrator.' },
    PAST_DUE:  { label: 'Payment Due',  color: 'warning', icon: <ErrorOutlineIcon sx={{ fontSize: '16px !important' }} />, tooltip: 'Payment past due — read-only mode. Please update your billing.' },
    EXPIRED:   { label: 'Expired',      color: 'warning', icon: <AccessTimeIcon sx={{ fontSize: '16px !important' }} />,   tooltip: 'Subscription expired — read-only mode. Contact your administrator.' },
  };
  const badge = tenantStatus ? STATUS_BADGE[tenantStatus] : null;
  const { mode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);




  // Menu handlers
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };





  const handleUserInfoClick = () => {
    navigate('/profile');
  };

  // Create menu items for desktop
  const desktopMenuItems = createMenuItems({
    user: user!,
    mode,
    navigate,
    onToggleTheme: toggleTheme,
    onLogout: logout,
    onClose: handleClose,
    onMobileMenuClose: handleMobileMenuClose,
    isMobile: false,
  });

  // Create menu items for mobile
  const mobileMenuItems = createMenuItems({
    user: user!,
    mode,
    navigate,
    onToggleTheme: toggleTheme,
    onLogout: logout,
    onClose: handleClose,
    onMobileMenuClose: handleMobileMenuClose,
    isMobile: true,
  });

  if (!user) return null;

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        background: mode === 'light' 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderBottom: mode === 'light' 
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: 56, sm: 64, md: 70 },
        px: { xs: 1, sm: 2, md: 3 }
      }}>
        {/* Logo */}
        <HeaderLogo mode={mode} />
        
        {/* Actions */}
        <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1, md: 2 }}>
          {/* User Info */}
          <UserAvatar 
            user={user}
            mode={mode}
            onClick={handleUserInfoClick}
            isMobile={isMobile}
          />



          {/* Status badge */}
          {showStatusBadge && badge && (
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

          {/* Language Selector */}
          <LanguageSelector />

          {/* Desktop Theme Toggle */}
          {!isMobile && (
            <ThemeToggleButton mode={mode} onToggle={toggleTheme} />
          )}

          {/* Menu Button */}
          <MenuButton
            onClick={isMobile ? handleMobileMenuToggle : handleMenu}
            mode={mode}
            isMobile={isMobile}
          />

          {/* Desktop Menu */}
          <DesktopMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            menuItems={desktopMenuItems}
          />

          {/* Mobile Drawer */}
          <MobileDrawer
            open={mobileMenuOpen}
            onClose={handleMobileMenuClose}
            user={user}
            mode={mode}
            menuItems={mobileMenuItems}
          />


        </Box>
      </Toolbar>
      

    </AppBar>
  );
};

export default Header;