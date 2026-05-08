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
import { notificationsApi } from '@/src/features/notifications/api/notifications';
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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if the string is a valid UUID v4 — i.e. a real DB notification ID */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUUID(id: string): boolean {
  return UUID_RE.test(id);
}

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
  // Uses GET /notifications — the only source that has real read/unread state.
  // GET /dashboard/activities returns ticket activities with no read field.

  const loadActivities = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await notificationsApi.getNotifications();
      if (__DEV__) console.log('[ActivityFeed] Raw response:', JSON.stringify(response)?.slice(0, 300));

      // Handle both array response and paginated { data: [...] } response
      const items: any[] = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];

      if (__DEV__) console.log(`[ActivityFeed] ${items.length} items after normalization`);

      const mapped: ActivityItem[] = items.map((n) => ({
        id:             n.id,
        notificationId: n.id,
        type:           n.type as NotificationType,
        data: {
          ticket:      n.data?.ticketId
            ? { id: n.data.ticketId, title: n.data.ticketTitle ?? n.title }
            : undefined,
          description: n.message,
        },
        timestamp: n.createdAt,
        read:      n.read ?? false,
      }));

      setActivities(mapped);
      setUnreadCount(mapped.filter((a) => !a.read).length);
    } catch (err) {
      if (__DEV__) console.error('[ActivityFeed] ❌ loadActivities failed:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      if (__DEV__) console.log('[ActivityFeed] Initial load triggered');
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
          // Store the real DB notification ID separately — used for markAsRead API calls
          notificationId: raw.id ?? undefined,
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
      // Persist to DB
      notificationsApi.markAllAsRead().catch(() => {});
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
    // Only call API if this is a real persisted notification (has a DB UUID)
    const item = activities.find((a) => a.id === id);
    const notifId = item?.notificationId ?? (isUUID(id) ? id : null);
    if (notifId) notificationsApi.markAsRead(notifId).catch(() => {});
  }, [activities]);

  const markUnread = useCallback((id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: false } : a))
    );
    setUnreadCount((c) => c + 1);
    // Only call API if this is a real persisted notification
    const item = activities.find((a) => a.id === id);
    const notifId = item?.notificationId ?? (isUUID(id) ? id : null);
    if (notifId) notificationsApi.markAsUnread(notifId).catch(() => {});
  }, [activities]);

  const markAllRead = useCallback(() => {
    // Optimistic update
    setActivities((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
    // Persist to DB
    notificationsApi.markAllAsRead().catch(() => {});
  }, []);

  const markAllUnread = useCallback(() => {
    // Optimistic update
    setActivities((prev) => prev.map((a) => ({ ...a, read: false })));
    setUnreadCount(activities.length);
    // Persist to DB
    notificationsApi.markAllAsUnread().catch(() => {});
  }, [activities.length]);

  const clearAll = useCallback(() => {
    // Local only — no backend endpoint for clear-all
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
