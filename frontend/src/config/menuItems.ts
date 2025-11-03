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
  onOpenAdminPanel?: () => void;
  onOpenKanban?: () => void;
  onOpenDocuments?: () => void;
  onOpenProfile?: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onClose: () => void;
  onMobileMenuClose: () => void;
}

export const createMenuItems = ({
  user,
  mode,
  onOpenAdminPanel,
  onOpenKanban,
  onOpenDocuments,
  onOpenProfile,
  onToggleTheme,
  onLogout,
  onClose,
  onMobileMenuClose,
}: CreateMenuItemsProps): MenuItem[] => {
  return [
    {
      label: "Profile",
      icon: React.createElement(PersonIcon),
      onClick: () => {
        if (onOpenProfile) onOpenProfile();
        onClose();
        onMobileMenuClose();
      },
    },
    {
      label: "Dashboard",
      icon: React.createElement(DashboardIcon),
      onClick: () => {
        onClose();
        onMobileMenuClose();
      },
    },
    {
      label: "Kanban Board",
      icon: React.createElement(KanbanIcon),
      onClick: () => {
        if (onOpenKanban) onOpenKanban();
        onClose();
        onMobileMenuClose();
      },
    },
    ...(onOpenDocuments
      ? [
          {
            label: "Documents",
            icon: React.createElement(DocumentIcon),
            onClick: () => {
              onOpenDocuments();
              onClose();
              onMobileMenuClose();
            },
          },
        ]
      : []),
        ...(user?.role === "ADMIN" && onOpenAdminPanel
      ? [
          {
            label: "Admin Panel",
            icon: React.createElement(AdminPanelSettingsIcon),
            onClick: () => {
              onOpenAdminPanel();
              onClose();
              onMobileMenuClose();
            },
          },
        ]
      : []),
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