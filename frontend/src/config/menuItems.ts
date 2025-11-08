// config/menuItems.ts
import React from "react";
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  ViewColumn as KanbanIcon,
  Description as DocumentIcon,

  } from "@mui/icons-material";
import { type MenuItem, type UserInfo } from "../types/header";

interface CreateMenuItemsProps {
  user: UserInfo;
  mode: "light" | "dark";
  navigate: (path: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onClose: () => void;
  onMobileMenuClose: () => void;
  isMobile?: boolean;
}

export const createMenuItems = ({
  user,
  mode,
  navigate,
  onToggleTheme,
  onLogout,
  onClose,
  onMobileMenuClose,
  isMobile = false,
}: CreateMenuItemsProps): MenuItem[] => {
  return [
    {
      label: "Profile",
      icon: React.createElement(PersonIcon),
      onClick: () => {
        navigate('/profile');
        onClose();
        onMobileMenuClose();
      },
    },
    {
      label: "Kanban Board",
      icon: React.createElement(KanbanIcon),
      onClick: () => {
        navigate('/kanban');
        onClose();
        onMobileMenuClose();
      },
    },

    ...(user?.role === "EMPLOYEE" || user?.role === "ADMIN"
      ? [
          {
            label: "Documents",
            icon: React.createElement(DocumentIcon),
            onClick: () => {
              navigate('/documents');
              onClose();
              onMobileMenuClose();
            },
          },
        ]
      : []),
        ...(user?.role === "ADMIN"
      ? [
          {
            label: "Admin Panel",
            icon: React.createElement(AdminPanelSettingsIcon),
            onClick: () => {
              navigate('/admin');
              onClose();
              onMobileMenuClose();
            },
          },
        ]
      : []),
    ...(isMobile ? [
      {
        label: mode === "light" ? "Dark Mode" : "Light Mode",
        icon: React.createElement(
          mode === "light" ? DarkModeIcon : LightModeIcon
        ),
        onClick: () => {
          onToggleTheme();
          onClose();
          onMobileMenuClose();
        },
      },
    ] : []),
    {
      label: "Logout",
      icon: React.createElement(LogoutIcon),
      onClick: () => {
        onLogout();
        onClose();
        onMobileMenuClose();
      },
      color: "error.main",
    },
  ];
};