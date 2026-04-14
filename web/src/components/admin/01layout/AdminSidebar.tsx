import React from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Divider, Typography, Tooltip,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import type { SxProps, Theme } from '@mui/material/styles';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

export interface AdminSidebarProps {
  drawerWidth?: number;
  mobileOpen?: boolean;
  desktopOpen?: boolean;
  items: MenuItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onMobileClose?: () => void;
  sx?: SxProps<Theme>;
}

import { useThemeStore } from '../../../stores/themeStore';

const DEFAULT_DRAWER_WIDTH = 240;

const SidebarContent: React.FC<Pick<AdminSidebarProps, 'items' | 'selectedId' | 'onSelect' | 'onMobileClose'>> = ({
  items, selectedId, onSelect, onMobileClose,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Toolbar sx={{ gap: 1 }}>
      <AdminPanelSettingsIcon color="primary" fontSize="small" />
      <Typography variant="h6" noWrap fontWeight={700} sx={{ flexGrow: 1 }}>
        Admin Panel
      </Typography>
    </Toolbar>

    <Divider />

    <List sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
      {items.map((item) => (
        <ListItem key={item.id} disablePadding>
          <Tooltip
            title={item.disabled ? 'Not available — account restricted' : ''}
            placement="right"
            disableHoverListener={!item.disabled}
          >
            <span style={{ width: '100%' }}>
              <ListItemButton
                selected={selectedId === item.id}
                disabled={item.disabled}
                onClick={() => {
                  onSelect(item.id);
                  onMobileClose?.();
                }}
                sx={{
                  mx: 1,
                  borderRadius: 1.5,
                  mb: 0.25,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { variant: 'body2', fontWeight: selectedId === item.id ? 700 : 400 } }}
                />
              </ListItemButton>
            </span>
          </Tooltip>
        </ListItem>
      ))}
    </List>
  </Box>
);

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  drawerWidth = DEFAULT_DRAWER_WIDTH,
  mobileOpen,
  desktopOpen = true,
  items,
  selectedId,
  onSelect,
  onMobileClose,
  sx,
}) => {
  const direction = useThemeStore((s) => s.direction);
  const anchor    = direction === 'rtl' ? 'right' : 'left';
  const paperSx   = { boxSizing: 'border-box' as const, width: drawerWidth, ...(sx as any) };
  const content   = <SidebarContent items={items} selectedId={selectedId} onSelect={onSelect} onMobileClose={onMobileClose} />;

  return (
    <nav>
      {/* Mobile — temporary overlay */}
      <Drawer
        variant="temporary"
        anchor={anchor}
        open={!!mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': paperSx }}
      >
        {content}
      </Drawer>

      {/* Desktop — persistent */}
      <Drawer
        variant="persistent"
        anchor={anchor}
        open={desktopOpen}
        sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': paperSx }}
      >
        {content}
      </Drawer>
    </nav>
  );
};

export default AdminSidebar;
