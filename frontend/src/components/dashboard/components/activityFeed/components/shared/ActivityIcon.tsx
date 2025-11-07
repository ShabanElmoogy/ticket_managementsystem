import React from "react";
import {
  Assignment as TicketIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Update as UpdateIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material";

const useActivityUtils = () => {
  const theme = useTheme();
  const getTypePalette = (type: string) => {
    const mode = theme.palette.mode;
    const accents = {
      light: {
        CREATED: { accent: "#10b981", iconInline: "#0f766e" },
        UPDATED: { accent: "#f59e0b", iconInline: "#b45309" },
        ASSIGNED: { accent: "#3b82f6", iconInline: "#1d4ed8" },
        COMMENT: { accent: "#8b5cf6", iconInline: "#6d28d9" },
        MUTED: { accent: "#6b7280", iconInline: "#4b5563" },
      },
      dark: {
        CREATED: { accent: "#34d399", iconInline: "#34d399" },
        UPDATED: { accent: "#fbbf24", iconInline: "#fbbf24" },
        ASSIGNED: { accent: "#60a5fa", iconInline: "#60a5fa" },
        COMMENT: { accent: "#a78bfa", iconInline: "#a78bfa" },
        MUTED: { accent: "#9ca3af", iconInline: "#9ca3af" },
      },
    } as const;
    const map = accents[mode === "dark" ? "dark" : "light"];
    const key = type === "TICKET_CREATED" ? "CREATED" : type === "TICKET_UPDATED" ? "UPDATED" : type === "TICKET_ASSIGNED" ? "ASSIGNED" : type === "COMMENT_ADDED" ? "COMMENT" : "MUTED";
    const accent = map[key].accent;
    const iconOnAccent = theme.palette.getContrastText(accent);
    const iconInline = map[key].iconInline;
    return { accent, iconOnAccent, iconInline };
  };
  return { getTypePalette };
};

interface ActivityIconProps {
  type: string;
  inline?: boolean;
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({ type, inline = false }) => {
  const { getTypePalette } = useActivityUtils();
  const palette = getTypePalette(type);
  const sx = { color: inline ? palette.iconInline : palette.iconOnAccent } as const;

  switch (type) {
    case "TICKET_CREATED":
      return <TicketIcon sx={sx} />;
    case "TICKET_UPDATED":
      return <UpdateIcon sx={sx} />;
    case "TICKET_ASSIGNED":
      return <PersonIcon sx={sx} />;
    case "COMMENT_ADDED":
      return <CommentIcon sx={sx} />;
    default:
      return <NotificationsIcon sx={sx} />;
  }
};