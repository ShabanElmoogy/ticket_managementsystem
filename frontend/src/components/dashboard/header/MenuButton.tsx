// components/header/MenuButton.tsx
import React from 'react';
import { IconButton } from '@mui/material';
import { Settings as SettingsIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';

interface MenuButtonProps {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  mode: 'light' | 'dark';
  isMobile: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick, mode, isMobile }) => {
  const buttonSize = { width: 40, height: 40 };
  const mobileButtonSize = { width: 36, height: 36 };

  return (
    <IconButton
      size="large"
      onClick={onClick}
      color="inherit"
      sx={{
        ...(!isMobile ? buttonSize : mobileButtonSize),
        backgroundColor: mode === 'light' 
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.05)',
        '&:hover': {
          backgroundColor: mode === 'light' 
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.1)',
        },
        border: mode === 'dark' 
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : 'none',
      }}
    >
      {isMobile ? <MoreVertIcon /> : <SettingsIcon />}
    </IconButton>
  );
};

export default MenuButton;