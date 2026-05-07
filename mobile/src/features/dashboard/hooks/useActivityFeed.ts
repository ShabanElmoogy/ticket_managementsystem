/**
 * useActivityFeed — Local state hook for the real-time activity feed.
 *
 * - Fetches the 20 most recent activities from GET /dashboard/activities on mount.
 * - Listens for Socket.IO `notification` events and prepends inline types.
 * - Refetches when the app returns to the foreground (AppState change).
 * - Exposes mark-read, mark-unread, and clear-all actions.
 *
 * ✅ Foreground-only — no background socket handling.
 * ✅ Uses existing `socketService.ts` — no separate socket instance.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const AppState = RN.AppState as any;
type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';
import { dashboardApi } from '@/src/features/dashboard/api/dashboard';
import { SOCKET } from '@/src/constants/api';
import type { ActivityItem } from '@/src/services/api/types/notification';
import type { NotificationType } from '@/src/services/api/types/notification';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityTypeFilter =
  | 'ALL'
  | 'TICKET_DELETED'
  | 'TICKET_RESTORED'
  | NotificationType;

// ─────────────────────────────────────────────────────────────────────────────
// Inline types — prepended directly without a DB refetch
// ─────────────────────────────────────────────────────────────────────────────

const INLINE_TYPES: NotificationType[] = [
  'COMMENT_MENTION',
  'COMMENT_ADDED',
  'EPIC_FEATURE_STATUS_CHANGED',
  'TICKET_DUE_SOON',
  'TICKET_OVERDUE',
  'STATUS_CHANGED',
  'PRIORITY_ESCALATED',
];

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useActivityFeed() {
  const [activities,   setActivities]   = useState<ActivityItem[]>([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [typeFilter,   setTypeFilter]   = useState<ActivityTypeFilter>('ALL');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [filterExpanded, setFilterExpanded] = useState(false);

  // Track whether we've done the initial load
  const initialLoadDone = useRef(false);

  // ── Load activities from API ───────────────────────────────────────────────

  const loadActivities = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const items = await dashboardApi.getActivities(20);
      setActivities(items);
      setUnreadCount(items.filter((a) => !a.read).length);
    } catch {
      // NetworkErrorDialog handles API errors automatically
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadActivities();
    }
  }, [loadActivities]);

  // ── AppState foreground refetch ────────────────────────────────────────────

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        loadActivities(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [loadActivities]);

  // ── Socket.IO listener ─────────────────────────────────────────────────────

  useEffect(() => {
    // Socket is not available on web
    if (Platform.OS === 'web') return;

    let socket: ReturnType<typeof import('@/src/services/socketService').getSocket> | null = null;

    try {
      const { getSocket } = require('@/src/services/socketService');
      socket = getSocket();
    } catch {
      return;
    }

    if (!socket) return;

    const handler = (raw: any) => {
      if (!raw?.type) return;

      if (INLINE_TYPES.includes(raw.type as NotificationType)) {
        // Prepend inline — no DB refetch needed
        const item: ActivityItem = {
          id: `${raw.id || raw.type}-${Date.now()}`,
          type: raw.type as NotificationType,
          data: {
            ticket:        raw.data?.ticket,
            commentBy:     raw.data?.commentBy,
            mentionedUsers: raw.data?.mentionedUsers,
            mentionedBy:   raw.data?.mentionedBy,
            comment:       raw.data?.comment,
            description:   raw.message, // top-level message → data.description
          },
          timestamp: raw.timestamp
            ? new Date(raw.timestamp).toISOString()
            : new Date().toISOString(),
          read: false,
        };
        setActivities((prev) => [item, ...prev.slice(0, 19)]);
        setUnreadCount((c) => c + 1);
      } else {
        // Refetch from DB for types that need fresh server data
        loadActivities(true);
      }
    };

    socket.on(SOCKET.EVENTS.NOTIFICATION, handler);

    return () => {
      // Always pass the named handler reference — never socket.off('notification')
      socket?.off(SOCKET.EVENTS.NOTIFICATION, handler);
    };
  }, [loadActivities]);

  // ── Panel collapse — mark visible items as read after 500ms ───────────────

  const handlePanelExpand = useCallback(() => {
    setPanelExpanded(true);
    setTimeout(() => {
      setActivities((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnreadCount(0);
    }, 500);
  }, []);

  const handlePanelCollapse = useCallback(() => {
    setPanelExpanded(false);
  }, []);

  // ── Mark read / unread / clear all ────────────────────────────────────────

  const markRead = useCallback((id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markUnread = useCallback((id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: false } : a))
    );
    setUnreadCount((c) => c + 1);
  }, []);

  const markAllRead = useCallback(() => {
    setActivities((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
  }, []);

  const markAllUnread = useCallback(() => {
    setActivities((prev) => prev.map((a) => ({ ...a, read: false })));
    setUnreadCount(activities.length);
  }, [activities.length]);

  const clearAll = useCallback(() => {
    setActivities([]);
    setUnreadCount(0);
  }, []);

  // ── Derived: filtered activities ──────────────────────────────────────────

  const filteredActivities = activities.filter((a) => {
    // Type filter
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const ticketTitle = a.data.ticket?.title?.toLowerCase() ?? '';
      const description = a.data.description?.toLowerCase() ?? '';
      if (!ticketTitle.includes(q) && !description.includes(q)) return false;
    }

    return true;
  });

  // ── Type counts for filter chips ──────────────────────────────────────────

  const typeCounts = activities.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  return {
    activities: filteredActivities,
    allActivities: activities,
    unreadCount,
    loading,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    panelExpanded,
    filterExpanded,
    setFilterExpanded,
    handlePanelExpand,
    handlePanelCollapse,
    markRead,
    markUnread,
    markAllRead,
    markAllUnread,
    clearAll,
    refetch: () => loadActivities(),
    typeCounts,
  };
}
