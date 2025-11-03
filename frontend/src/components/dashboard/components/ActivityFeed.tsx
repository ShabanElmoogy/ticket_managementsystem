import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  ListItemButton,
  Skeleton,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as TicketIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Update as UpdateIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../../stores/authStore";
import { dashboardApi, ticketsApi, type Ticket } from "../../../services/api";
import { io, Socket } from "socket.io-client";

interface ActivityItem {
  id: string;
  type:
    | "TICKET_CREATED"
    | "TICKET_UPDATED"
    | "TICKET_ASSIGNED"
    | "COMMENT_ADDED";
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    commentBy?: string;
  };
  timestamp: string;
  read?: boolean;
}

interface ActivityFeedProps {
  onTicketClick: (ticket: Ticket) => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ onTicketClick }) => {
  const { user, token } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clickingActivity, setClickingActivity] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<
    | "ALL"
    | "TICKET_CREATED"
    | "TICKET_UPDATED"
    | "TICKET_ASSIGNED"
    | "COMMENT_ADDED"
  >("ALL");

  // Load initial activities
  useEffect(() => {
    const loadInitialActivities = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const initialActivities = await dashboardApi.getActivities(20);
        setActivities(
          initialActivities.map((activity: ActivityItem) => ({ ...activity, read: true }))
        );
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialActivities();
  }, [token]);

  // Setup socket connection
  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Join user room for targeted notifications
    newSocket.emit("join", user.id);

    // Listen for notifications
    newSocket.on("notification", (notification: ActivityItem) => {
      setActivities((prev) => [
        { ...notification, read: false },
        ...prev.slice(0, 19),
      ]); // Keep only last 20 items
      setUnreadCount((prev) => prev + 1);

      // Play notification sound (optional)
      try {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
        );
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio fails
      } catch {
        // Ignore audio errors
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

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
    const key =
      type === "TICKET_CREATED"
        ? "CREATED"
        : type === "TICKET_UPDATED"
        ? "UPDATED"
        : type === "TICKET_ASSIGNED"
        ? "ASSIGNED"
        : type === "COMMENT_ADDED"
        ? "COMMENT"
        : "MUTED";

    const accent = map[key].accent;
    const iconOnAccent = theme.palette.getContrastText(accent);
    const iconInline = map[key].iconInline;
    return { accent, iconOnAccent, iconInline };
  };

  const getActivityIcon = (type: string, inline = false) => {
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

  const getActivityColor = (type: string) => getTypePalette(type).accent;

  const getActivityMessage = (activity: ActivityItem) => {
    const { type, data } = activity;

    switch (type) {
      case "TICKET_CREATED":
        return {
          primary: `New ticket: ${data.ticket?.title}`,
          secondary: `Created by ${data.createdBy}`,
        };
      case "TICKET_UPDATED":
        return {
          primary: `Ticket updated: ${data.ticket?.title}`,
          secondary: `Updated by ${data.updatedBy}`,
        };
      case "TICKET_ASSIGNED":
        return {
          primary: `Ticket assigned: ${data.ticket?.title}`,
          secondary: `Assigned to ${data.assignedTo}`,
        };
      case "COMMENT_ADDED":
        return {
          primary: `New comment on: ${data.ticket?.title}`,
          secondary: `Comment by ${data.commentBy}`,
        };
      default:
        return {
          primary: "New activity",
          secondary: "",
        };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded && unreadCount > 0) {
      // Mark all as read when expanding if there are unread notifications
      setTimeout(() => {
        setUnreadCount(0);
        setActivities((prev) =>
          prev.map((activity: ActivityItem) => ({ ...activity, read: true }))
        );
      }, 500); // Small delay to show the expansion animation first
    }
  };

  const handleClearAll = () => {
    setActivities([]);
    setUnreadCount(0);
  };

  const handleActivityClick = async (activity: ActivityItem) => {
    if (!token || !activity.data.ticket?.id || clickingActivity) return;

    try {
      setClickingActivity(activity.id);

      // Mark this activity as read
      setActivities((prev) =>
        prev.map((item: ActivityItem) =>
          item.id === activity.id ? { ...item, read: true } : item
        )
      );

      // Decrease unread count if it was unread
      if (!activity.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Fetch full ticket details and open dialog
      const fullTicket = await ticketsApi.getTicket(activity.data.ticket.id);
      onTicketClick(fullTicket);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setClickingActivity(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "#ef4444";
      case "HIGH":
        return "#f97316";
      case "MEDIUM":
        return "#eab308";
      case "LOW":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "#3b82f6";
      case "IN_PROGRESS":
        return "#f59e0b";
      case "RESOLVED":
        return "#10b981";
      case "CLOSED":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const filteredActivities = useMemo(() => {
    if (typeFilter === "ALL") return activities;
    return activities.filter((a: ActivityItem) => a.type === typeFilter);
  }, [activities, typeFilter]);

  return (
    <Paper
      elevation={2}
      sx={{
        width: { xs: "100%", lg: 350 },
        height: "fit-content",
        maxHeight: { xs: "400px", lg: "80vh" },
        position: { xs: "relative", lg: "sticky" },
        top: { xs: 0, lg: 20 },
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={handleToggleExpanded}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.75rem",
                minWidth: "18px",
                height: "18px",
                animation: unreadCount > 0 ? "pulse 2s infinite" : "none",
              },
              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
                "100%": { transform: "scale(1)" },
              },
            }}
          >
            <NotificationsIcon />
          </Badge>
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{ fontWeight: 600, fontSize: { xs: "1rem", lg: "1.25rem" } }}
          >
            {isMobile ? "Activity" : "Activity Feed"}
            {unreadCount > 0 && (
              <Typography component="span" variant="caption" sx={{ ml: 1, color: "rgba(255,255,255,0.8)", fontWeight: 400, fontSize: { xs: "0.7rem", lg: "0.75rem" } }}>
                ({unreadCount} new)
              </Typography>
            )}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {activities.length > 0 && (
            <IconButton
              size="small"
              sx={{ color: "white" }}
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" sx={{ color: "white" }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Filters */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {(["ALL", "TICKET_CREATED", "TICKET_UPDATED", "TICKET_ASSIGNED", "COMMENT_ADDED"] as const).map((t) => (
            <Chip
              key={t}
              size="small"
              label={
                t === "ALL"
                  ? "All"
                  : t.replace("TICKET_", "").replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
              }
              variant={typeFilter === t ? "filled" : "outlined"}
              onClick={() => setTypeFilter(t)}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>

        {/* Activity List */}
        <Box sx={{ maxHeight: { xs: "300px", lg: "60vh" }, overflow: "auto", mt: 1 }}>
          {loading ? (
            <List sx={{ p: 0 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <ListItem key={i} sx={{ px: 2, py: 1.5 }}>
                  <Box sx={{ width: 3, bgcolor: "action.hover", borderRadius: 1, mr: 1 }} />
                  <ListItemAvatar>
                    <Skeleton variant="circular" width={36} height={36} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Skeleton width="70%" />}
                    secondary={<Skeleton width="40%" />}
                  />
                </ListItem>
              ))}
            </List>
          ) : filteredActivities.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              <NotificationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">No recent activity</Typography>
              <Typography variant="caption" color="text.disabled">
                New tickets and updates will appear here
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredActivities.map((activity: ActivityItem, index: number) => {
                const message = getActivityMessage(activity);
                const isLast = index === filteredActivities.length - 1;
                const isClicking = clickingActivity === activity.id;
                const hasTicket = activity.data.ticket?.id;

                return (
                  <React.Fragment key={activity.id}>
                    <Tooltip
                      title={hasTicket ? "Click to view ticket details" : "No ticket associated"}
                      placement="left"
                    >
                      <ListItem disablePadding sx={{
                        '&:not(:last-child)': {
                          // subtle separator using divider color, but not a full border
                          borderBottom: 0,
                          mb: 0.25,
                        },
                      }}>
                        <Box sx={{ width: 3, bgcolor: getActivityColor(activity.type), borderRadius: 1, ml: 2, mr: 1, opacity: theme.palette.mode === 'dark' ? 0.95 : 1 }} />
                        <ListItemButton
                          onClick={hasTicket ? () => handleActivityClick(activity) : undefined}
                          disabled={isClicking}
                          sx={{
                            py: 1.25,
                            pr: 2,
                            pl: 0,
                            cursor: hasTicket ? "pointer" : "default",
                            opacity: isClicking ? 0.7 : 1,
                            borderRadius: 1,
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: getActivityColor(activity.type), width: 36, height: 36, color: getTypePalette(activity.type).iconOnAccent }}>
                              {getActivityIcon(activity.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                {message.primary}
                              </Typography>
                            }
                            secondary={
                              `${message.secondary} • ${formatTime(activity.timestamp)}`
                            }
                          />
                          {isClicking && (
                            <Box sx={{ ml: 2 }}>
                              <CircularProgress size={20} />
                            </Box>
                          )}
                        </ListItemButton>
                      </ListItem>
                    </Tooltip>
                    {/* Remove heavy inset Divider; rely on spacing for separation */}
                    {!isLast && <Box sx={{ mx: 2, height: 6 }} />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ActivityFeed;
