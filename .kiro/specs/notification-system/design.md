# Design Document — Push Notification System

## Overview

This document describes the technical design for the push notification system in the TicketFlow mobile app. The system adds Expo push notifications on top of the existing Socket.IO real-time layer, sharing the same `NotificationType` values and backend notification records. It is designed as a self-contained feature module at `mobile/src/features/notifications/` that integrates with the existing `BaseApiService`, Zustand store pattern, and `expo-router` navigation.

---

## Architecture

### High-Level Flow

```
App Boot (authenticated)
  └─ NotificationService.initialize()
       ├─ setupAndroidChannels()          (Android only)
       ├─ setNotificationHandler()        (foreground display config)
       ├─ requestPermissions()
       │    └─ granted → registerPushToken()
       │         ├─ getExpoPushTokenAsync()
       │         ├─ AsyncStorage.setItem('expo_push_token', token)
       │         └─ POST /notifications/push-token  (with retry)
       ├─ addNotificationReceivedListener()   → ForegroundHandler
       ├─ addNotificationResponseReceivedListener() → ResponseHandler
       ├─ GET /notifications/count → NotificationStore.setUnreadCount()
       └─ getLastNotificationResponseAsync()  (killed-app cold start)

Incoming Push (any app state)
  ├─ Foreground → ForegroundHandler
  │    ├─ NotificationStore.prependNotification() + incrementUnreadCount()
  │    └─ toast.show(title, body)
  ├─ Background tap → ResponseHandler → router.push(deepLinkTarget)
  └─ Killed-app tap → getLastNotificationResponseAsync() → router.push(deepLinkTarget)

User Logout
  └─ NotificationService.cleanup()
       ├─ DELETE /notifications/push-token
       ├─ AsyncStorage.removeItem('expo_push_token')
       ├─ subscription.remove() × 2
       └─ NotificationStore.reset()
```

### Integration with Socket.IO

The push notification system is additive — it does not replace the Socket.IO real-time layer. Both channels deliver the same `NotificationType` values:

- **Socket.IO** handles foreground real-time updates (already implemented in `ActivityFeed.tsx`)
- **Push notifications** handle background/killed-app delivery

When the app is in the foreground, both channels may fire for the same event. The `ForegroundHandler` deduplicates by checking if a notification with the same `id` already exists in `NotificationStore` before prepending.

---

## File Structure

```
mobile/src/features/notifications/
├── index.ts                          ← public barrel
├── api/
│   └── notifications.ts             ← NotificationsApiService + singleton
├── services/
│   └── NotificationService.ts       ← singleton class, no JSX
├── stores/
│   └── notificationStore.ts         ← Zustand store
├── hooks/
│   └── useNotifications.ts          ← UI hook
├── components/
│   └── NotificationsScreen.tsx      ← list screen
└── types/
    └── types.ts                     ← NotificationItem, NotificationPayload, etc.
```

---

## Types

**File:** `mobile/src/features/notifications/types/types.ts`

```ts
import type { NotificationType } from '@/src/services/api/types';

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unavailable';   // simulator, web, or Expo Go

export interface NotificationItem {
  id:        string;
  type:      NotificationType;
  title:     string;
  message:   string;
  read:      boolean;
  createdAt: string;           // ISO string
  data?: {
    screen?:   DeepLinkScreen;
    params?:   Record<string, string>;
    ticketId?: string;
  };
}

export type DeepLinkScreen =
  | 'ticket-detail'
  | 'notifications'
  | 'dashboard';

export interface NotificationPayload {
  title:     string;
  body:      string;
  data: {
    type:      NotificationType;
    screen?:   DeepLinkScreen;
    params?:   Record<string, string>;
    ticketId?: string;
  };
  sound?:     string;
  badge?:     number;
  channelId?: AndroidChannelId;
}

export type AndroidChannelId =
  | 'ticket-updates'
  | 'mentions'
  | 'reminders'
  | 'general';

export interface PushTokenRegistration {
  token:    string;
  platform: 'ios' | 'android';
}
```

---

## API Service

**File:** `mobile/src/features/notifications/api/notifications.ts`

Extends `BaseApiService` following the exact pattern used by `CustomersApiService`.

```ts
import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { NotificationItem, PushTokenRegistration } from '../types/types';

export class NotificationsApiService extends BaseApiService {
  getNotifications  = ()                              => this.get<NotificationItem[]>(API.NOTIFICATIONS.LIST);
  getUnreadCount    = ()                              => this.get<{ count: number }>(API.NOTIFICATIONS.COUNT);
  markAsRead        = (id: string)                    => this.patch<{ message: string }>(API.NOTIFICATIONS.READ(id), {});
  markAllAsRead     = ()                              => this.post<{ message: string }>(API.NOTIFICATIONS.READ_ALL, {});
  registerPushToken = (data: PushTokenRegistration)  => this.post<{ message: string }>('/notifications/push-token', data);
  deletePushToken   = ()                              => this.delete<{ message: string }>('/notifications/push-token');
}

export const notificationsApi  = new NotificationsApiService();
export const notificationsKeys = QUERY_KEYS.NOTIFICATIONS;
```

Two new API paths need to be added to `mobile/src/constants/api.ts` under `NOTIFICATIONS`:

```ts
export const NOTIFICATIONS = {
  // ...existing...
  PUSH_TOKEN: '/notifications/push-token',
} as const;
```

---

## Zustand Store

**File:** `mobile/src/features/notifications/stores/notificationStore.ts`

Follows the `uiStore` pattern. `unreadCount` is persisted to AsyncStorage (survives app restarts). The `notifications` array and `pushToken` are session-only — cleared on logout.

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationItem, NotificationPermissionStatus } from '../types/types';

const MAX_NOTIFICATIONS = 50;

interface NotificationState {
  // Persisted
  unreadCount:           number;

  // Session-only
  notifications:         NotificationItem[];
  permissionStatus:      NotificationPermissionStatus;
  pushToken:             string | null;
  navigationReady:       boolean;
  tokenRegistrationFailed: boolean;

  // Actions
  setUnreadCount:        (count: number) => void;
  incrementUnreadCount:  () => void;
  clearUnreadCount:      () => void;
  prependNotification:   (item: NotificationItem) => void;
  markAsRead:            (id: string) => void;
  markAllAsRead:         () => void;
  setPermissionStatus:   (status: NotificationPermissionStatus) => void;
  setPushToken:          (token: string | null) => void;
  setNavigationReady:    (ready: boolean) => void;
  setTokenRegistrationFailed: (failed: boolean) => void;
  reset:                 () => void;   // called on logout
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      unreadCount:             0,
      notifications:           [],
      permissionStatus:        'undetermined',
      pushToken:               null,
      navigationReady:         false,
      tokenRegistrationFailed: false,

      setUnreadCount:       (unreadCount)  => set({ unreadCount }),
      incrementUnreadCount: ()             => set((s) => ({ unreadCount: s.unreadCount + 1 })),
      clearUnreadCount:     ()             => set({ unreadCount: 0 }),

      prependNotification: (item) =>
        set((s) => {
          // Deduplicate — skip if same id already present (socket + push double-fire)
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

      setPermissionStatus:        (permissionStatus)        => set({ permissionStatus }),
      setPushToken:               (pushToken)               => set({ pushToken }),
      setNavigationReady:         (navigationReady)         => set({ navigationReady }),
      setTokenRegistrationFailed: (tokenRegistrationFailed) => set({ tokenRegistrationFailed }),

      reset: () =>
        set({
          notifications:           [],
          pushToken:               null,
          tokenRegistrationFailed: false,
          // unreadCount persisted — cleared separately via clearUnreadCount
        }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unreadCount: state.unreadCount,
        // notifications, pushToken, permissionStatus are session-only
      }),
    }
  )
);
```

**Why `unreadCount` is persisted but `notifications` is not:**
The badge count must survive app restarts so the icon badge is correct before the first API call completes. The full notification list is always fetched fresh from the backend on the notifications screen mount, so persisting it would only create stale-data risk.

---

## NotificationService

**File:** `mobile/src/features/notifications/services/NotificationService.ts`

A pure TypeScript class — no JSX, no React hooks. Exported as a singleton `notificationService`.

### Key Design Decisions

**Idempotent `initialize()`:** An `_initialized` boolean flag prevents double-registration of listeners if `initialize()` is called more than once (e.g. on auth state change).

**Expo Go guard:** `isExpoGo()` checks `Constants.appOwnership === 'expo'`. When true, push token registration is skipped entirely and `permissionStatus` is set to `'unavailable'`. Local notifications still work.

**Retry with exponential backoff:** Token registration retries up to 3 times with delays of 2s, 4s, 8s. Uses a simple recursive `setTimeout` — no external library needed.

**Deferred navigation:** On killed-app cold start, `getLastNotificationResponseAsync()` may fire before the navigation stack is ready. The service stores the pending `DeepLinkTarget` and navigates when `NotificationStore.navigationReady` becomes `true`.

### Public API

```ts
class NotificationService {
  // Lifecycle
  initialize():                    Promise<void>
  cleanup():                       Promise<void>

  // Permissions & token
  requestPermissions():            Promise<NotificationPermissionStatus>
  registerPushToken():             Promise<void>
  openNotificationSettings():      void

  // Notification actions
  markAsRead(id: string):          Promise<void>
  markAllAsRead():                 Promise<void>

  // Local notifications
  scheduleLocalNotification(
    title:       string,
    body:        string,
    triggerDate: Date,
    data?:       Record<string, unknown>,
    channelId?:  AndroidChannelId,
  ):                               Promise<string>   // returns identifier
  cancelLocalNotification(identifier: string): Promise<void>
  cancelAllLocalNotifications():   Promise<void>

  // Utilities
  isExpoGo():                      boolean
  isPushSupported():               boolean
}

export const notificationService = new NotificationService();
```

### `initialize()` Sequence

```ts
async initialize(): Promise<void> {
  if (this._initialized) return;
  this._initialized = true;

  if (__DEV__) console.log('[NotificationService] Initializing...');

  try {
    // 1. Android channels (no-op on iOS)
    await this._setupAndroidChannels();

    // 2. Foreground display config
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge:  true,
      }),
    });

    // 3. Register listeners
    this._foregroundSub = Notifications.addNotificationReceivedListener(
      this._handleForegroundNotification
    );
    this._responseSub = Notifications.addNotificationResponseReceivedListener(
      this._handleNotificationResponse
    );

    // 4. Permissions + token
    const status = await this.requestPermissions();
    if (status === 'granted') {
      await this.registerPushToken();
    }

    // 5. Sync unread count from backend
    await this._syncUnreadCount();

    // 6. Handle killed-app tap
    await this._checkInitialNotification();

    if (__DEV__) console.log('[NotificationService] Initialized');
  } catch (err) {
    console.error('[NotificationService] initialize() failed:', err);
    // Never re-throw — notification failure must not crash the app
  }
}
```

### Android Channels

```ts
private async _setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channels: Notifications.NotificationChannelInput[] = [
    { id: 'ticket-updates', name: 'Ticket Updates',      importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0, 250, 250, 250], sound: 'default' },
    { id: 'mentions',       name: 'Mentions & Comments', importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0, 250, 250, 250], sound: 'default' },
    { id: 'reminders',      name: 'Reminders',           importance: Notifications.AndroidImportance.DEFAULT, vibrationPattern: null,               sound: null      },
    { id: 'general',        name: 'General',             importance: Notifications.AndroidImportance.LOW,     vibrationPattern: null,               sound: null      },
  ];

  for (const channel of channels) {
    await Notifications.setNotificationChannelAsync(channel.id, channel);
  }
}
```

### Deep Link Navigation

```ts
private _navigate(screen?: DeepLinkScreen, params?: Record<string, string>): void {
  try {
    switch (screen) {
      case 'ticket-detail':
        if (params?.ticketId) {
          router.push({ pathname: '/(app)/ticket/[id]', params: { id: params.ticketId } });
        } else {
          router.push('/(tabs)/notifications');
        }
        break;
      case 'dashboard':
        router.push('/(tabs)/');
        break;
      case 'notifications':
      default:
        router.push('/(tabs)/notifications');
        break;
    }
  } catch (err) {
    console.error('[NotificationService] Navigation failed:', err);
    try { router.push('/(tabs)/notifications'); } catch { /* ignore */ }
  }
}
```

### Token Registration with Retry

```ts
private async _registerWithRetry(token: string, attempt = 1): Promise<void> {
  const MAX_ATTEMPTS = 3;
  try {
    await notificationsApi.registerPushToken({
      token,
      platform: Platform.OS as 'ios' | 'android',
    });
    useNotificationStore.getState().setTokenRegistrationFailed(false);
    if (__DEV__) console.log('[NotificationService] Push token registered');
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      const delay = Math.pow(2, attempt) * 1000;   // 2s, 4s, 8s
      if (__DEV__) console.warn(`[NotificationService] Token registration failed, retry ${attempt} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
      return this._registerWithRetry(token, attempt + 1);
    }
    console.error('[NotificationService] Token registration failed after all retries:', err);
    useNotificationStore.getState().setTokenRegistrationFailed(true);
  }
}
```

---

## `useNotifications` Hook

**File:** `mobile/src/features/notifications/hooks/useNotifications.ts`

Thin bridge between `NotificationStore` and UI components. Does not call `notificationService` directly — that is the store's job.

```ts
import { useNotificationStore } from '../stores/notificationStore';
import { notificationService }  from '../services/NotificationService';

export function useNotifications() {
  const notifications         = useNotificationStore((s) => s.notifications);
  const unreadCount           = useNotificationStore((s) => s.unreadCount);
  const permissionStatus      = useNotificationStore((s) => s.permissionStatus);
  const pushToken             = useNotificationStore((s) => s.pushToken);
  const tokenRegistrationFailed = useNotificationStore((s) => s.tokenRegistrationFailed);

  return {
    notifications,
    unreadCount,
    permissionStatus,
    pushToken,
    tokenRegistrationFailed,
    markAsRead:   notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    clearAll:     () => useNotificationStore.getState().reset(),
  };
}
```

---

## Notifications Screen

**File:** `mobile/src/features/notifications/components/NotificationsScreen.tsx`

Follows the existing screen patterns. Uses `useQuery` for the notification list (React Query manages loading/error states), and calls `markAllAsRead()` on mount.

### Key Behaviors

- On mount: calls `notificationService.markAllAsRead()` → clears badge + marks all read in DB
- Pull-to-refresh: calls `refetch()` from `useQuery`
- Item tap: calls `notificationService.markAsRead(id)` then navigates to `item.data?.screen`
- Empty state: `<AppEmptyState ionicon="notifications-outline" />`
- Unread items: bold title + `c.interactive.primary` left border (2px)
- Read items: normal weight + `c.text.muted` title

### Visual Treatment

```ts
// Unread notification row
{
  borderLeftWidth: 3,
  borderLeftColor: c.interactive.primary,
  backgroundColor: c.surface.secondary,
}

// Read notification row
{
  borderLeftWidth: 3,
  borderLeftColor: 'transparent',
  backgroundColor: c.surface.primary,
}
```

### Type Icon Mapping

Each `NotificationType` maps to an Ionicons name for the notification row icon:

| Type | Icon | Color |
|---|---|---|
| `TICKET_CREATED` | `ticket-outline` | `c.interactive.primary` |
| `TICKET_UPDATED` | `create-outline` | `c.intent.info` |
| `TICKET_ASSIGNED` | `person-outline` | `c.intent.info` |
| `COMMENT_ADDED` | `chatbubble-outline` | `c.intent.success` |
| `COMMENT_MENTION` | `at-outline` | `c.intent.warning` |
| `COMMENT_DELETED` | `trash-outline` | `c.intent.error` |
| `STATUS_CHANGED` | `swap-horizontal-outline` | `c.intent.info` |
| `PRIORITY_ESCALATED` | `arrow-up-circle-outline` | `c.intent.error` |
| `TICKET_DUE_SOON` | `time-outline` | `c.intent.warning` |
| `TICKET_OVERDUE` | `warning-outline` | `c.intent.error` |
| `EPIC_FEATURE_STATUS_CHANGED` | `git-branch-outline` | `c.intent.info` |

---

## Bootstrap Integration

`NotificationService.initialize()` is called in `app/_layout.tsx` after authentication is confirmed, as step 7 in the existing `bootstrap()` function:

```ts
// In bootstrap() — after step 6 (syncPaginationSettings)
if (useAuthStore.getState().isAuthenticated) {
  // 7. Initialize push notifications (non-blocking — never delays app render)
  notificationService.initialize().catch(() => {});
}
```

`setNavigationReady(true)` is called from the root layout after `setReady(true)`:

```ts
setReady(true);
useNotificationStore.getState().setNavigationReady(true);
```

On logout, `notificationService.cleanup()` is called from `authStore.logout()`:

```ts
logout: () => {
  // ...existing cleanup...
  notificationService.cleanup().catch(() => {});
},
```

---

## Backend Requirements

The backend needs two new endpoints and one schema change. These are outside the mobile scope but documented here for completeness.

### New Endpoints

```
POST   /notifications/push-token
  Body: { token: string, platform: 'ios' | 'android' }
  Auth: required
  → Upserts the push token for the authenticated user

DELETE /notifications/push-token
  Auth: required
  → Deletes all push tokens for the authenticated user

PATCH  /notifications/:id/read
  Auth: required
  → Marks a single notification as read
```

`GET /notifications/count` and `POST /notifications/read-all` already exist per the `NOTIFICATIONS` constants in `api.ts`.

### Push Sending

The backend sends via `POST https://exp.host/--/api/v2/push/send`. The payload shape:

```json
{
  "to":        "ExponentPushToken[...]",
  "title":     "Ticket Updated",
  "body":      "Ticket #123 status changed to In Progress",
  "sound":     "default",
  "badge":     3,
  "channelId": "ticket-updates",
  "data": {
    "type":     "STATUS_CHANGED",
    "screen":   "ticket-detail",
    "params":   { "ticketId": "uuid-here" },
    "ticketId": "uuid-here"
  }
}
```

---

## `app.json` Changes

```json
{
  "expo": {
    "notification": {
      "icon":        "./assets/images/notification-icon.png",
      "color":       "#6366f1",
      "androidMode": "default",
      "sounds":      []
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon":        "./assets/images/notification-icon.png",
          "color":       "#6366f1",
          "sounds":      [],
          "androidMode": "default"
        }
      ]
    ]
  }
}
```

---

## `eas.json` Configuration

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution":      "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## Notification Bell in App Header

The existing `AppHeaderBar` component needs a bell icon that shows the `unreadCount` badge. The bell reads from `useNotificationStore` directly (not via `useNotifications` hook, to avoid re-renders from the full notifications array):

```tsx
const unreadCount = useNotificationStore((s) => s.unreadCount);

<Pressable onPress={() => router.push('/(tabs)/notifications')}>
  <Ionicons name="notifications-outline" size={22} color={c.text.inverse} />
  {unreadCount > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
    </View>
  )}
</Pressable>
```

---

## Error Handling Strategy

All errors in `NotificationService` follow the same pattern:

1. Wrap every async operation in `try/catch`
2. Log with `console.error('[NotificationService]', err)` in dev
3. Never re-throw — notification failures must not crash the app
4. Update `NotificationStore` with failure flags where the UI needs to surface them (e.g. `tokenRegistrationFailed`)

The `tokenRegistrationFailed` flag is surfaced in the app settings screen as a non-blocking warning banner using the existing `AlertBanner` component.

---

## Testing Considerations

- **Simulator/web:** `isPushSupported()` returns `false` → push token registration skipped, local notifications still work
- **Expo Go:** `isExpoGo()` returns `true` → same as simulator for push, local notifications work
- **Development Build:** Full push notification flow available on physical device
- **Killed-app navigation:** Requires physical device testing — `getLastNotificationResponseAsync()` cannot be tested in simulator

---

## Implementation Checklist

### New Files
- [ ] `mobile/src/features/notifications/types/types.ts`
- [ ] `mobile/src/features/notifications/api/notifications.ts`
- [ ] `mobile/src/features/notifications/stores/notificationStore.ts`
- [ ] `mobile/src/features/notifications/services/NotificationService.ts`
- [ ] `mobile/src/features/notifications/hooks/useNotifications.ts`
- [ ] `mobile/src/features/notifications/components/NotificationsScreen.tsx`
- [ ] `mobile/src/features/notifications/index.ts`

### Modified Files
- [ ] `mobile/src/constants/api.ts` — add `NOTIFICATIONS.PUSH_TOKEN` path
- [ ] `mobile/app/_layout.tsx` — call `notificationService.initialize()` in bootstrap, `setNavigationReady(true)` after `setReady(true)`
- [ ] `mobile/src/stores/authStore.ts` — call `notificationService.cleanup()` in `logout()`
- [ ] `mobile/src/components/layout/header/AppHeaderBar.tsx` (or equivalent) — add notification bell with badge
- [ ] `mobile/app.json` — add `expo-notifications` plugin config
- [ ] `mobile/eas.json` — add build profiles

### Assets
- [ ] `mobile/assets/images/notification-icon.png` — monochrome PNG, 96×96px minimum

### Backend
- [ ] `POST /notifications/push-token` endpoint
- [ ] `DELETE /notifications/push-token` endpoint
- [ ] `PATCH /notifications/:id/read` endpoint
- [ ] Push token table in DB (userId, token, platform, createdAt)
- [ ] Expo Push API sender utility (batch up to 100, handle `DeviceNotRegistered`)
