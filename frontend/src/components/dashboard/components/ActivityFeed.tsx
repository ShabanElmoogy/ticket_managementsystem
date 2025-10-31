import React, { useState, useEffect } from "react";
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
  Divider,
  IconButton,
  Collapse,
  Badge,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
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
import { apiService, type Ticket } from "../../../services/api";
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

  // Load initial activities
  useEffect(() => {
    const loadInitialActivities = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const initialActivities = await apiService.getActivities(token, 20);
        setActivities(
          initialActivities.map((activity) => ({ ...activity, read: true }))
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TICKET_CREATED":
        return <TicketIcon sx={{ color: "#10b981" }} />;
      case "TICKET_UPDATED":
        return <UpdateIcon sx={{ color: "#f59e0b" }} />;
      case "TICKET_ASSIGNED":
        return <PersonIcon sx={{ color: "#3b82f6" }} />;
      case "COMMENT_ADDED":
        return <CommentIcon sx={{ color: "#8b5cf6" }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "TICKET_CREATED":
        return "#10b981";
      case "TICKET_UPDATED":
        return "#f59e0b";
      case "TICKET_ASSIGNED":
        return "#3b82f6";
      case "COMMENT_ADDED":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

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
          prev.map((activity) => ({ ...activity, read: true }))
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
        prev.map((item) =>
          item.id === activity.id ? { ...item, read: true } : item
        )
      );

      // Decrease unread count if it was unread
      if (!activity.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Fetch full ticket details and open dialog
      const fullTicket = await apiService.getTicket(
        token,
        activity.data.ticket.id
      );
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
                "0%": {
                  transform: "scale(1)",
                },
                "50%": {
                  transform: "scale(1.1)",
                },
                "100%": {
                  transform: "scale(1)",
                },
              },
            }}
          >
            <NotificationsIcon />
          </Badge>
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", lg: "1.25rem" },
            }}
          >
            {isMobile ? "Activity" : "Activity Feed"}
            {unreadCount > 0 && (
              <Typography
                component="span"
                variant="caption"
                sx={{
                  ml: 1,
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 400,
                  fontSize: { xs: "0.7rem", lg: "0.75rem" },
                }}
              >
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

      {/* Activity List */}
      <Collapse in={expanded}>
        <Box sx={{ maxHeight: { xs: "300px", lg: "60vh" }, overflow: "auto" }}>
          {loading ? (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">Loading activities...</Typography>
            </Box>
          ) : activities.length === 0 ? (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <NotificationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">No recent activity</Typography>
              <Typography variant="caption" color="text.disabled">
                New tickets and updates will appear here
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {activities.map((activity, index) => {
                const message = getActivityMessage(activity);
                const isLast = index === activities.length - 1;

                const isClicking = clickingActivity === activity.id;
                const hasTicket = activity.data.ticket?.id;

                return (
                  <React.Fragment key={activity.id}>
                    <Tooltip
                      title={
                        hasTicket
                          ? "Click to view ticket details"
                          : "No ticket associated"
                      }
                      placement="left"
                    >
                      <ListItem
                        component={hasTicket ? "button" : "div"}
                        onClick={
                          hasTicket
                            ? () => handleActivityClick(activity)
                            : undefined
                        }
                        disabled={isClicking}
                        sx={{
                          py: 1.5,
                          px: 2,
                          backgroundColor: activity.read
                            ? "transparent"
                            : "action.hover",
                          cursor: hasTicket ? "pointer" : "default",
                          opacity: isClicking ? 0.7 : 1,
                          "&:hover": {
                            backgroundColor: hasTicket
                              ? "action.selected"
                              : "transparent",
                          },
                          borderLeft: activity.read ? "none" : "4px solid",
                          borderLeftColor: activity.read
                            ? "transparent"
                            : getActivityColor(activity.type),
                          position: "relative",
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              backgroundColor: getActivityColor(activity.type),
                              width: 36,
                              height: 36,
                            }}
                          >
                            {getActivityIcon(activity.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, mb: 0.5 }}
                            >
                              {message.primary}
                            </Typography>
                          }
                          // Replace this part in your ListItemText secondary prop:

                          secondary={
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                component="span"
                                display="block"
                              >
                                {message.secondary}
                              </Typography>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginTop: "4px",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                  component="span"
                                >
                                  {formatTime(activity.timestamp)}
                                </Typography>
                                {activity.data.ticket?.priority && (
                                  <Chip
                                    component="span"
                                    label={activity.data.ticket.priority}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: "0.6rem",
                                      backgroundColor: getPriorityColor(
                                        activity.data.ticket.priority
                                      ),
                                      color: "white",
                                      fontWeight: 600,
                                      display: "inline-flex",
                                    }}
                                  />
                                )}
                                {activity.data.ticket?.status && (
                                  <Chip
                                    component="span"
                                    label={activity.data.ticket.status.replace(
                                      "_",
                                      " "
                                    )}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: "0.6rem",
                                      backgroundColor: getStatusColor(
                                        activity.data.ticket.status
                                      ),
                                      color: "white",
                                      fontWeight: 600,
                                      display: "inline-flex",
                                    }}
                                  />
                                )}
                              </span>
                            </>
                          }
                        />
                        {isClicking && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: "50%",
                              right: 16,
                              transform: "translateY(-50%)",
                            }}
                          >
                            <CircularProgress size={20} />
                          </Box>
                        )}
                      </ListItem>
                    </Tooltip>
                    {!isLast && <Divider variant="inset" component="li" />}
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
