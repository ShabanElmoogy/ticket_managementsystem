import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  List,
  Collapse,
  Skeleton,
  TextField,
  InputAdornment,
  Typography
} from "@mui/material";
import {
  Search as SearchIcon,
} from "@mui/icons-material";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../stores/authStore";
import { dashboardApi, ticketsApi, type Ticket } from "../../../../services/api";
import { ActivityHeader } from "./components/header";
import { ActivityItem } from "./components/item";
type ActivityItemType = {
  id: string;
  type: "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED";
  data: {
    ticket?: { id: string; title: string; priority?: string; status?: string };
    createdBy?: string;
    updatedBy?: string;
    assignedTo?: string;
    commentBy?: string;
  };
  timestamp: string;
  read?: boolean;
};

type ActivityFeedProps = {
  onTicketClick?: (ticket: Ticket) => void;
};

type ActivityTypeFilter = "ALL" | "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_ASSIGNED" | "COMMENT_ADDED";

const useActivitySocket = (
  setActivities: React.Dispatch<React.SetStateAction<ActivityItemType[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>
) => {
  const { user } = useAuthStore();
  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3001");
    socket.emit("join", user.id);
    socket.on("notification", (notification: any) => {
      console.log('Activity feed received notification:', notification);
      const activityItem: ActivityItemType = {
        id: notification.id || Date.now().toString(),
        type: notification.type || "TICKET_ASSIGNED",
        data: {
          ticket: notification.data?.ticket,
          createdBy: notification.data?.createdBy,
          updatedBy: notification.data?.updatedBy,
          assignedTo: notification.data?.assignedTo || notification.data?.assigneeName || user?.name,
          commentBy: notification.data?.commentBy
        },
        timestamp: notification.timestamp || new Date().toISOString(),
        read: false
      };
      console.log('Adding activity item:', activityItem);
      setActivities(prev => [activityItem, ...prev.slice(0, 19)]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, setActivities, setUnreadCount]);
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ onTicketClick }) => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItemType[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clickingActivity, setClickingActivity] = useState<string | null>(null);
   const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>("ALL");
   const [searchQuery, setSearchQuery] = useState("");

  useActivitySocket(setActivities, setUnreadCount);

  useEffect(() => {
    const loadInitialActivities = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const initialActivities = await dashboardApi.getActivities(20);
        setActivities(
          initialActivities.map((activity: ActivityItemType) => ({ ...activity, read: true }))
        );
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialActivities();
  }, [token]);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded && unreadCount > 0) {
      setTimeout(() => {
        setUnreadCount(0);
        setActivities((prev) =>
          prev.map((activity: ActivityItemType) => ({ ...activity, read: true }))
        );
      }, 500);
    }
  };

  const handleClearAll = () => {
    setActivities([]);
    setUnreadCount(0);
  };

  const handleMarkAsRead = (activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId ? { ...activity, read: true } : activity
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = () => {
    setActivities((prev) =>
      prev.map((activity) => ({ ...activity, read: true }))
    );
    setUnreadCount(0);
  };

  const handleMarkAllUnread = () => {
    setActivities((prev) =>
      prev.map((activity) => ({ ...activity, read: false }))
    );
    setUnreadCount(activities.length);
  };

  const handleMarkAsUnread = (activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId ? { ...activity, read: false } : activity
      )
    );
    setUnreadCount((prev) => prev + 1);
  };

  const handleActivityClick = async (activity: ActivityItemType) => {
    if (clickingActivity) return;

    // Try to robustly extract a ticket ID from various possible shapes
    const ticketId = activity?.data?.ticket?.id
      || (activity as any)?.data?.ticket?.ticketId
      || (activity as any)?.data?.ticketId
      || (activity as any)?.ticketId
      || "";

    if (!ticketId) {
      console.warn("Activity click ignored: missing ticket id in activity:", activity);
      return;
    }

    try {
      setClickingActivity(activity.id);

      setActivities((prev) =>
        prev.map((item: ActivityItemType) =>
          item.id === activity.id ? { ...item, read: true } : item
        )
      );

      if (!activity.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (onTicketClick) {
        if (!token) {
          console.warn("Missing auth token; cannot fetch full ticket for dialog. Activity:", activity);
          return;
        }
        const fullTicket = await ticketsApi.getTicket(ticketId);
        onTicketClick(fullTicket);
      } else {
        navigate(`/tickets/${ticketId}`);
      }
    } catch (error) {
      console.error("Error handling activity click:", error);
    } finally {
      setClickingActivity(null);
    }
  };

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Filter by type
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((a: ActivityItemType) => a.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a: ActivityItemType) => {
        const ticketTitle = a.data.ticket?.title?.toLowerCase() || "";
        const message = `${a.data.createdBy || ""} ${a.data.updatedBy || ""} ${a.data.assignedTo || ""} ${a.data.commentBy || ""}`.toLowerCase();
        return ticketTitle.includes(query) || message.includes(query);
      });
    }

    return filtered;
  }, [activities, typeFilter, searchQuery]);

  return (
    <Paper
      elevation={3}
      sx={{
        width: { xs: "100%", lg: 350 },
        height: "fit-content",
        maxHeight: { xs: "75vh", lg: "85vh" },
        minHeight: { xs: "60vh", lg: "70vh" },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: (theme) => theme.shadows[6],
        },
      }}
    >
      <ActivityHeader
        expanded={expanded}
        unreadCount={unreadCount}
        typeFilter={typeFilter}
        onToggleExpanded={handleToggleExpanded}
        onClearAll={handleClearAll}
        onTypeFilterChange={(filter) => setTypeFilter(filter as ActivityTypeFilter)}
        onMarkAllRead={handleMarkAllRead}
        onMarkAllUnread={handleMarkAllUnread}
      />

      <Collapse in={expanded}>
        <Box sx={{ maxHeight: { xs: "55vh", lg: "70vh" }, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {expanded && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: (theme) => theme.palette.background.paper,
                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                    "&.Mui-focused": {
                      backgroundColor: (theme) => theme.palette.background.paper,
                    },
                  },
                }}
              />
            </Box>
          )}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {loading ? (
              <Box sx={{ p: 2 }}>
                {[...Array(5)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={80}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </Box>
            ) : filteredActivities.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {searchQuery ? "No matching activities" : "No activities yet"}
                </Typography>
                <Typography variant="body2">
                  {searchQuery ? "Try adjusting your search or filters" : "Activities will appear here when tickets are updated"}
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0 }}>
                {filteredActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    onClick={handleActivityClick}
                    isClicking={clickingActivity === activity.id}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAsUnread={handleMarkAsUnread}
                  />
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};