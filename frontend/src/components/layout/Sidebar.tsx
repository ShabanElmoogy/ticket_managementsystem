import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Apps,
  People,
  Business,
  ConfirmationNumber,
  Task,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const { t } = useTranslation();

  const menuItems = [
    { key: 'dashboard', icon: <Dashboard />, path: '/' },
    { key: 'applications', icon: <Apps />, path: '/applications' },
    { key: 'users', icon: <People />, path: '/users' },
    { key: 'customers', icon: <Business />, path: '/customers' },
    { key: 'tickets', icon: <ConfirmationNumber />, path: '/tickets' },
    { key: 'tasks', icon: <Task />, path: '/tasks' },
  ];

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={t(`nav.${item.key}`)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;