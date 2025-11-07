import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  List,
  Collapse,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import { io } from "socket.io-client";
import { useAuthStore } from "../../../../stores/authStore";
import { dashboardApi, ticketsApi } from "../../../../services/api";
import { ActivityHeader } from "./components/ActivityHeader";
import { ActivityItem } from "./components/ActivityItem";
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
  onTicketClick: (ticket: any) => void;
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
      const activityItem: ActivityItemType = {
        id: notification.id || Date.now().toString(),
        type: notification.type || "TICKET_ASSIGNED",
        data: {
          ticket: notification.data?.ticket,
          assignedTo: notification.data?.assigneeName || user?.name
        },
        timestamp: notification.timestamp || new Date().toISOString(),
        read: false
      };
      setActivities(prev => [activityItem, ...prev.slice(0, 19)]);
      setUnreadCount(prev => prev + 1);
    });
    return () => socket.disconnect();
  }, [user, setActivities, setUnreadCount]);
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ onTicketClick }) => {
  const { token } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activities, setActivities] = useState<ActivityItemType[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clickingActivity, setClickingActivity] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>("ALL");

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

  const handleActivityClick = async (activity: ActivityItemType) => {
    if (!token || !activity.data.ticket?.id || clickingActivity) return;

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

      const fullTicket = await ticketsApi.getTicket(activity.data.ticket.id);
      onTicketClick(fullTicket);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setClickingActivity(null);
    }
  };

  const filteredActivities = useMemo(() => {
    if (typeFilter === "ALL") return activities;
    return activities.filter((a: ActivityItemType) => a.type === typeFilter);
  }, [activities, typeFilter]);

  return (
    <Paper
      elevation={2}
      sx={{
        width: { xs: "100%", lg: 350 },
        height: "fit-content",
        maxHeight: { xs: "50vh", lg: "70vh" },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <ActivityHeader
        expanded={expanded}
        unreadCount={unreadCount}
        typeFilter={typeFilter}
        onToggleExpanded={handleToggleExpanded}
        onClearAll={handleClearAll}
        onTypeFilterChange={(filter) => setTypeFilter(filter as ActivityTypeFilter)}
      />

      <Collapse in={expanded}>
        <Box sx={{ maxHeight: { xs: "40vh", lg: "60vh" }, overflow: "auto" }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {filteredActivities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  onClick={handleActivityClick}
                  isClicking={clickingActivity === activity.id}
                />
              ))}
            </List>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};