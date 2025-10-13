import React from "react";
import {
  Drawer,
  Toolbar,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface AdminSidebarProps {
  drawerWidth?: number;
  isMobile?: boolean;
  mobileOpen?: boolean;
  desktopOpen?: boolean;
  items: MenuItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onMobileClose?: () => void;
  sx?: SxProps<Theme>;
}

const DEFAULT_DRAWER_WIDTH = 240;

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  drawerWidth = DEFAULT_DRAWER_WIDTH,
  isMobile,
  mobileOpen,
  desktopOpen = true,
  items,
  selectedId,
  onSelect,
  onMobileClose,
  sx,
}) => {
  const menu = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Admin Panel
        </Typography>
        <AdminPanelSettingsIcon />
      </Toolbar>

      <Divider sx={{ mt: 0.8  }} />

      <List>
        {items.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={selectedId === item.id}
              onClick={() => {
                onSelect(item.id);
                if (isMobile && onMobileClose) onMobileClose();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <nav style={{ width: drawerWidth }}>
      <Drawer
        variant="temporary"
        open={!!mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          ...(sx as any),
        }}
      >
        {menu}
      </Drawer>
      <Drawer
        variant="persistent"
        open={desktopOpen}
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          ...(sx as any),
        }}
      >
        {menu}
      </Drawer>
    </nav>
  );
};

export default AdminSidebar;
