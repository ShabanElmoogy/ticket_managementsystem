// components/header/MobileDrawer.tsx
import React from "react";
import {
  Drawer,
  Box,
  Avatar,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  type MenuItem as MenuItemType,
  type UserInfo,
} from "../../../types/header";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  user: UserInfo;
  mode: "light" | "dark";
  menuItems: MenuItemType[];
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  user,
  mode,
  menuItems,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          background:
            mode === "light"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          color: "white",
        },
      }}
    >
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: user?.role === "ADMIN" ? "#ef4444" : "#10b981",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {getInitials(user?.name || "U")}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
              {user?.name}
            </Typography>
            <Chip
              label={user?.role}
              size="small"
              sx={{
                backgroundColor:
                  user?.role === "ADMIN"
                    ? "rgba(239, 68, 68, 0.3)"
                    : "rgba(16, 185, 129, 0.3)",
                color: "white",
                fontWeight: 500,
                fontSize: "0.75rem",
                border: `1px solid ${
                  user?.role === "ADMIN"
                    ? "rgba(239, 68, 68, 0.5)"
                    : "rgba(16, 185, 129, 0.5)"
                }`,
              }}
            />
          </Box>
        </Box>
      </Box>

      <List sx={{ pt: 2 }}>
        {menuItems
          .map((item, index) => [
            item.label === "Logout" && (
              <Box key={`divider-${index}`} sx={{ mx: 2, my: 1 }}>
                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.2)" }} />
              </Box>
            ),
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                onClick={item.onClick}
                sx={{
                  py: 1.5,
                  px: 3,
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                  color: item.color || "white",
                }}
              >
                <ListItemIcon
                  sx={{ color: item.color || "white", minWidth: 40 }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: "1rem",
                  }}
                />
              </ListItemButton>
            </ListItem>,
          ])
          .flat()
          .filter(Boolean)}
      </List>
    </Drawer>
  );
};

export default MobileDrawer;
