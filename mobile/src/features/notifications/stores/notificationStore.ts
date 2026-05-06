import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationItem, NotificationPermissionStatus } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 50;

// ─────────────────────────────────────────────────────────────────────────────
// State interface
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationState {
  // ── Persisted ──────────────────────────────────────────────────────────────
  /** Badge count — persisted so the icon badge is correct before the first API
   *  call completes on the next app launch. */
  unreadCount: number;

  // ── Session-only (cleared on logout via reset()) ───────────────────────────
  notifications:          NotificationItem[];
  permissionStatus:       NotificationPermissionStatus;
  pushToken:              string | null;
  navigationReady:        boolean;
  tokenRegistrationFailed: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setUnreadCount:              (count: number) => void;
  incrementUnreadCount:        () => void;
  clearUnreadCount:            () => void;

  /**
   * Prepend a new notification to the list.
   * - Deduplicates by `id` — skips if the same id already exists (socket + push
   *   double-fire guard).
   * - Caps the list at MAX_NOTIFICATIONS (50) items.
   * - Also increments `unreadCount`.
   */
  prependNotification:         (item: NotificationItem) => void;

  markAsRead:                  (id: string) => void;
  markAllAsRead:               () => void;

  setPermissionStatus:         (status: NotificationPermissionStatus) => void;
  setPushToken:                (token: string | null) => void;
  setNavigationReady:          (ready: boolean) => void;
  setTokenRegistrationFailed:  (failed: boolean) => void;

  /**
   * Called on logout — clears all session-only state.
   * `unreadCount` is NOT reset here; call `clearUnreadCount()` separately
   * (e.g. after the DELETE /push-token call succeeds in cleanup()).
   */
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      // ── Initial state ───────────────────────────────────────────────────────
      unreadCount:             0,
      notifications:           [],
      permissionStatus:        'undetermined',
      pushToken:               null,
      navigationReady:         false,
      tokenRegistrationFailed: false,

      // ── Unread count ────────────────────────────────────────────────────────
      setUnreadCount: (unreadCount) => set({ unreadCount }),

      incrementUnreadCount: () =>
        set((s) => ({ unreadCount: s.unreadCount + 1 })),

      clearUnreadCount: () => set({ unreadCount: 0 }),

      // ── Notification list ───────────────────────────────────────────────────
      prependNotification: (item) =>
        set((s) => {
          // Deduplicate — skip if same id already present
          if (s.notifications.some((n) => n.id === item.id)) return s;

          return {
            notifications: [item, ...s.notifications].slice(0, MAX_NOTIFICATIONS),
            unreadCount:   s.unreadCount + 1,
          };
        }),

      markAsRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount:   0,
        })),

      // ── Metadata ────────────────────────────────────────────────────────────
      setPermissionStatus:        (permissionStatus)        => set({ permissionStatus }),
      setPushToken:               (pushToken)               => set({ pushToken }),
      setNavigationReady:         (navigationReady)         => set({ navigationReady }),
      setTokenRegistrationFailed: (tokenRegistrationFailed) => set({ tokenRegistrationFailed }),

      // ── Logout cleanup ──────────────────────────────────────────────────────
      reset: () =>
        set({
          notifications:           [],
          pushToken:               null,
          permissionStatus:        'undetermined',
          navigationReady:         false,
          tokenRegistrationFailed: false,
          // unreadCount is intentionally NOT reset here — call clearUnreadCount()
          // separately after the backend DELETE /push-token call succeeds.
        }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist unreadCount — the notification list and push token are
      // always fetched fresh from the backend, so persisting them would only
      // create stale-data risk.
      partialize: (state) => ({
        unreadCount: state.unreadCount,
      }),
    }
  )
);
