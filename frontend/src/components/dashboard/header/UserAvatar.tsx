// components/header/UserAvatar.tsx
import React from "react";
import { Avatar, Box, Typography, Chip } from "@mui/material";
import { AdminPanelSettings as AdminPanelSettingsIcon } from "@mui/icons-material";
import { type UserInfo } from "../../../types/header";

interface UserAvatarProps {
  user: UserInfo;
  mode: "light" | "dark";
  onClick: () => void;
  isMobile?: boolean;
}

const isAdmin = (role?: string) => role === "TENANT_ADMIN" || role === "SUPER_ADMIN";
const isProgrammer = (role?: string) => role === "PROGRAMMER";

const getRoleColor = (role?: string) => {
  if (isAdmin(role)) return "#ef4444";
  if (isProgrammer(role)) return "#8b5cf6";
  return "#10b981";
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  mode,
  onClick,
  isMobile = false,
}) => {
  const buttonSize = { width: 40, height: 40 };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isMobile) {
    return (
      <Avatar
        onClick={onClick}
        sx={{
          width: { xs: 32, sm: 36 },
          height: { xs: 32, sm: 36 },
          backgroundColor: getRoleColor(user?.role),
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: isAdmin(user?.role) ? "pointer" : "default",
          border: "2px solid rgba(255, 255, 255, 0.2)",
          transition: "all 0.2s ease-in-out",
          "&:hover": isAdmin(user?.role)
            ? { transform: "scale(1.05)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }
            : {},
        }}
      >
        {getInitials(user?.name || "U")}
      </Avatar>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1.5}
      onClick={onClick}
      sx={{
        backgroundColor: mode === "light" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
        borderRadius: 3,
        padding: "8px 16px",
        backdropFilter: "blur(10px)",
        border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
        cursor: isAdmin(user?.role) ? "pointer" : "default",
        transition: "all 0.2s ease-in-out",
        "&:hover": isAdmin(user?.role)
          ? {
              backgroundColor: mode === "light" ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }
          : {},
      }}
    >
      <Avatar
        sx={{
          ...buttonSize,
          backgroundColor: getRoleColor(user?.role),
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        {getInitials(user?.name || "U")}
      </Avatar>
      <Box>
        <Typography variant="body2" sx={{ color: "white", fontWeight: 600, lineHeight: 1.2 }}>
          {user?.name}
          {isAdmin(user?.role) && (
            <AdminPanelSettingsIcon sx={{ ml: 1, fontSize: 16, verticalAlign: "middle", opacity: 0.8 }} />
          )}
        </Typography>
        <Chip
          label={isAdmin(user?.role) ? `${user?.role} - Click to manage` : user?.role}
          size="small"
          sx={{
            backgroundColor: isAdmin(user?.role) ? "rgba(239, 68, 68, 0.2)" : isProgrammer(user?.role) ? "rgba(139, 92, 246, 0.2)" : "rgba(16, 185, 129, 0.2)",
            color: isAdmin(user?.role) ? "#fecaca" : isProgrammer(user?.role) ? "#ddd6fe" : "#a7f3d0",
            fontWeight: 500,
            fontSize: "0.75rem",
            height: 20,
            border: `1px solid ${isAdmin(user?.role) ? "rgba(239, 68, 68, 0.3)" : isProgrammer(user?.role) ? "rgba(139, 92, 246, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
          }}
        />
      </Box>
    </Box>
  );
};

export default UserAvatar;
