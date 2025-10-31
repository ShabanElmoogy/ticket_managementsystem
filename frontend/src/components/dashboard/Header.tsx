// components/Header.tsx - Main Header Component
import React, { useState } from 'react';
import { AppBar, Toolbar, Box, useTheme, useMediaQuery } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { ticketsApi } from '../../services/api';
import { type HeaderProps } from '../../types/header';
import { useNotifications } from '../../hooks/useNotifications';
import { createMenuItems } from '../../config/menuItems';
import { formatNotificationTime } from '../../utils/notificationUtils';

// Component imports
import HeaderLogo from './header/HeaderLogo';
import UserAvatar from './header/UserAvatar';
import NotificationBell from './header/NotificationBell';
import ThemeToggleButton from './header/ThemeToggleButton';
import MenuButton from './header/MenuButton';
import DesktopMenu from './header/DesktopMenu';
import MobileDrawer from './header/MobileDrawer';
import NotificationPopover from './header/NotificationPopover';
import PWAInstallButton from '../pwa/PWAInstallButton';
import { UserProfile } from '../profile';

interface NotificationType {
  id: string;
  data?: {
    ticket?: {
      id: string;
    };
  };
}

const Header: React.FC<HeaderProps> = ({ onOpenAdminPanel, onOpenKanban, onOpenWhatsApp, onOpenWhatsAppUsers, onTicketClick }) => {
  const { user, logout, token } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Notifications hook
  const {
    notifications,
    unreadCount,
    loading: notificationLoading,
    markAllAsRead,
    clearAllNotifications,
    removeNotification,
    markNotificationAsRead,
  } = useNotifications({ user, token });

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

  // Notification handlers
  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    if (unreadCount > 0) {
      setTimeout(() => {
        markAllAsRead();
      }, 500);
    }
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleClearAllNotifications = () => {
    clearAllNotifications();
    handleNotificationClose();
  };

  const handleNotificationItemClick = async (notification: NotificationType) => {
    if (!token || !onTicketClick || !notification.data?.ticket?.id) return;

    try {
      markNotificationAsRead(notification.id);
      handleNotificationClose();
      
      const fullTicket = await ticketsApi.getTicket(notification.data.ticket.id);
      onTicketClick(fullTicket);
    } catch (_error) {
      console.error('Error fetching ticket details:', _error);
      handleNotificationClose();
    }
  };

  const handleUserInfoClick = () => {
    setProfileOpen(true);
  };

  // Create menu items
  const menuItems = createMenuItems({
    user: user!,
    mode,
    onOpenAdminPanel,
    onOpenKanban,
    onOpenWhatsApp,
    onOpenWhatsAppUsers,
    onOpenProfile: () => setProfileOpen(true),
    onToggleTheme: toggleTheme,
    onLogout: logout,
    onClose: handleClose,
    onMobileMenuClose: handleMobileMenuClose,
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

          {/* Notification Bell */}
          <NotificationBell
            unreadCount={unreadCount}
            onClick={handleNotificationClick}
            mode={mode}
            isMobile={isMobile}
          />

          {/* PWA Install Button */}
          <PWAInstallButton
            variant="icon"
            size={isMobile ? 'small' : 'medium'}
            color="inherit"
            showTooltip={!isMobile}
          />

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
            menuItems={menuItems}
          />

          {/* Mobile Drawer */}
          <MobileDrawer
            open={mobileMenuOpen}
            onClose={handleMobileMenuClose}
            user={user}
            mode={mode}
            menuItems={menuItems}
          />

          {/* Notification Popover */}
          <NotificationPopover
            open={Boolean(notificationAnchorEl)}
            anchorEl={notificationAnchorEl}
            onClose={handleNotificationClose}
            notifications={notifications}
            unreadCount={unreadCount}
            loading={notificationLoading}
            onClearAll={handleClearAllNotifications}
            onMarkAllAsRead={markAllAsRead}
            onRemoveNotification={removeNotification}
            onNotificationItemClick={handleNotificationItemClick}
            formatTime={formatNotificationTime}
          />
        </Box>
      </Toolbar>
      
      {/* User Profile Dialog */}
      <UserProfile
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </AppBar>
  );
};

export default Header;
