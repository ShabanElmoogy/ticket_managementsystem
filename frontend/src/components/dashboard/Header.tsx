// components/Header.tsx - Main Header Component
import React, { useState } from 'react';
import { AppBar, Toolbar, Box, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

import { type HeaderProps } from '../../types/header';
import { createMenuItems } from '../../config/menuItems';

// Component imports
import HeaderLogo from './header/HeaderLogo';
import UserAvatar from './header/UserAvatar';

import ThemeToggleButton from './header/ThemeToggleButton';
import MenuButton from './header/MenuButton';
import DesktopMenu from './header/DesktopMenu';
import MobileDrawer from './header/MobileDrawer';




const Header: React.FC<HeaderProps> = ({ onTicketClick: _ }) => {
  const { user, logout } = useAuthStore();
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