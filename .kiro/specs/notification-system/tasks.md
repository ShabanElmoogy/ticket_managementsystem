# Implementation Tasks — Push Notification System

## Tasks

- [x] 1. Foundation — types, API constants, and API service
  - [x] 1.1 Create `mobile/src/features/notifications/types/types.ts` with `NotificationPermissionStatus`, `NotificationItem`, `DeepLinkScreen`, `NotificationPayload`, `AndroidChannelId`, and `PushTokenRegistration` types as specified in the design
  - [x] 1.2 Add `PUSH_TOKEN: '/notifications/push-token'` to the `NOTIFICATIONS` constant in `mobile/src/constants/api.ts`
  - [x] 1.3 Create `mobile/src/features/notifications/api/notifications.ts` with `NotificationsApiService` extending `BaseApiService`, implementing `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `registerPushToken`, and `deletePushToken` methods using `API.NOTIFICATIONS.*` constants; export singleton `notificationsApi` and `notificationsKeys`

- [x] 2. Zustand notification store
  - [x] 2.1 Create `mobile/src/features/notifications/stores/notificationStore.ts` with `useNotificationStore` following the `uiStore` pattern — state fields: `unreadCount` (persisted), `notifications`, `permissionStatus`, `pushToken`, `navigationReady`, `tokenRegistrationFailed` (all session-only); persist only `unreadCount` to AsyncStorage under key `notification-storage`
  - [x] 2.2 Implement all store actions: `setUnreadCount`, `incrementUnreadCount`, `clearUnreadCount`, `prependNotification` (with deduplication by `id` and 50-item cap), `markAsRead`, `markAllAsRead`, `setPermissionStatus`, `setPushToken`, `setNavigationReady`, `setTokenRegistrationFailed`, `reset`

- [x] 3. NotificationService — core class
  - [x] 3.1 Create `mobile/src/features/notifications/services/NotificationService.ts` as a pure TypeScript class (no JSX, no React hooks) with private fields `_initialized: boolean`, `_foregroundSub`, `_responseSub`, and `_pendingDeepLink`
  - [x] 3.2 Implement `isExpoGo()` returning `Constants.appOwnership === 'expo'` and `isPushSupported()` returning `true` only when platform is `ios` or `android` AND not Expo Go
  - [x] 3.3 Implement `requestPermissions()` — uses `Notifications.requestPermissionsAsync()` on iOS, `Notifications.getPermissionsAsync()` on Android; skips and sets `permissionStatus` to `'unavailable'` on simulator/web/Expo Go; stores result in `notificationStore`
  - [x] 3.4 Implement `_setupAndroidChannels()` — creates four channels (`ticket-updates` HIGH+sound+vibration, `mentions` HIGH+sound+vibration, `reminders` DEFAULT no sound/vibration, `general` LOW no sound/vibration) guarded by `Platform.OS === 'android'`
  - [x] 3.5 Implement `registerPushToken()` — calls `Notifications.getExpoPushTokenAsync({ projectId })` using `Constants.expoConfig.extra.eas.projectId`; stores token string only in AsyncStorage under key `expo_push_token` and in `notificationStore`; calls `_registerWithRetry()`
  - [x] 3.6 Implement `_registerWithRetry(token, attempt)` — retries `POST /notifications/push-token` up to 3 times with exponential backoff (2s, 4s, 8s); sets `tokenRegistrationFailed` flag after all retries exhausted
  - [x] 3.7 Implement `_handleForegroundNotification` — maps the `Notifications.Notification` object to a `NotificationItem`, calls `notificationStore.prependNotification()`, calls `Notifications.setBadgeCountAsync(unreadCount)`, and shows a toast via `react-native-toast-message` with the notification title and body
  - [x] 3.8 Implement `_handleNotificationResponse` — extracts `data.screen` and `data.params` from `notification.request.content.data`; calls `markAsRead(id)` on the backend; calls `_navigate(screen, params)`
  - [x] 3.9 Implement `_navigate(screen, params)` — routes `ticket-detail` to `/(app)/ticket/[id]` with `ticketId` param, `dashboard` to `/(app)/index`, `notifications` and fallback to `/(app)/notifications`; wraps in try/catch and falls back to notifications screen on error
  - [x] 3.10 Implement `_checkInitialNotification()` — calls `Notifications.getLastNotificationResponseAsync()`; if a response exists and `navigationReady` is true, navigates immediately; otherwise stores in `_pendingDeepLink` and subscribes to `notificationStore` until `navigationReady` becomes true
  - [x] 3.11 Implement `_syncUnreadCount()` — calls `GET /notifications/count` and sets `notificationStore.setUnreadCount(count)`; wrapped in try/catch
  - [x] 3.12 Implement `initialize()` — idempotent via `_initialized` flag; calls `_setupAndroidChannels`, `Notifications.setNotificationHandler({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true })`, registers `_foregroundSub` and `_responseSub`, calls `requestPermissions`, conditionally calls `registerPushToken`, calls `_syncUnreadCount`, calls `_checkInitialNotification`; entire body wrapped in try/catch that never re-throws
  - [x] 3.13 Implement `markAsRead(id)` — calls `PATCH /notifications/:id/read` via `notificationsApi`, then calls `notificationStore.markAsRead(id)`; wrapped in try/catch
  - [x] 3.14 Implement `markAllAsRead()` — calls `POST /notifications/read-all` via `notificationsApi`, then calls `notificationStore.markAllAsRead()` and `Notifications.setBadgeCountAsync(0)`; wrapped in try/catch
  - [x] 3.15 Implement `scheduleLocalNotification(title, body, triggerDate, data?, channelId?)` — throws `Error('Trigger date must be in the future')` if `triggerDate <= new Date()`; calls `Notifications.scheduleNotificationAsync` with `DateTriggerInput`; defaults `channelId` to `'reminders'`; returns the identifier string
  - [x] 3.16 Implement `cancelLocalNotification(identifier)` and `cancelAllLocalNotifications()` wrapping the corresponding `Notifications.*` calls in try/catch
  - [x] 3.17 Implement `openNotificationSettings()` calling `Linking.openSettings()`
  - [x] 3.18 Implement `cleanup()` — calls `DELETE /notifications/push-token` via `notificationsApi`, removes `expo_push_token` from AsyncStorage, calls `.remove()` on `_foregroundSub` and `_responseSub`, calls `notificationStore.reset()` and `notificationStore.clearUnreadCount()`, resets `_initialized` to `false`
  - [x] 3.19 Export singleton `export const notificationService = new NotificationService()` at the bottom of the file
  - [x] 3.20 Add `__DEV__` logging with `[NotificationService]` prefix to all lifecycle events: permission request result, token registration success/failure, notification received, notification tapped, initialize start/complete, cleanup

- [x] 4. `useNotifications` hook and feature barrel
  - [x] 4.1 Create `mobile/src/features/notifications/hooks/useNotifications.ts` — reads `notifications`, `unreadCount`, `permissionStatus`, `pushToken`, `tokenRegistrationFailed` from `useNotificationStore`; exposes `markAsRead`, `markAllAsRead` bound to `notificationService`; exposes `clearAll` calling `notificationStore.reset()`
  - [x] 4.2 Create `mobile/src/features/notifications/index.ts` barrel exporting `notificationService`, `useNotificationStore`, `useNotifications`, `notificationsApi`, and all types from `types/types.ts`

- [x] 5. Bootstrap integration
  - [x] 5.1 In `mobile/app/_layout.tsx`, import `notificationService` and `useNotificationStore`; after `setReady(true)` call `useNotificationStore.getState().setNavigationReady(true)`; in the `bootstrap()` function after step 6 (syncPaginationSettings), add step 7: `if (useAuthStore.getState().isAuthenticated) { notificationService.initialize().catch(() => {}); }`
  - [x] 5.2 In `mobile/src/stores/authStore.ts`, import `notificationService` from the notifications feature; in the `logout` action, add `notificationService.cleanup().catch(() => {})` before the `set({...})` call

- [x] 6. App header — migrate unreadCount to notificationStore
  - [x] 6.1 In `mobile/src/components/layout/header/AppHeaderBar.tsx`, replace `const { unreadCount } = useUiStore()` with `const unreadCount = useNotificationStore((s) => s.unreadCount)`; add the `useNotificationStore` import; remove the `unreadCount`-related import from `useUiStore` if it is no longer used there

- [x] 7. Notifications screen
  - [x] 7.1 Create `mobile/src/features/notifications/components/NotificationsScreen.tsx` — uses `useQuery` with `notificationsKeys.all` and `notificationsApi.getNotifications` to fetch the list; on mount calls `notificationService.markAllAsRead()`; renders a `FlatList` with pull-to-refresh calling `refetch()`
  - [x] 7.2 Implement the notification row — shows a type icon (Ionicons, mapped per the design's type icon table), bold title + `c.interactive.primary` left border (3px) for unread items, muted title + transparent left border for read items, relative timestamp, and the notification message as secondary text
  - [x] 7.3 Implement row tap — calls `notificationService.markAsRead(item.id)` then navigates using `router.push` to the screen specified in `item.data?.screen` (falling back to `/(app)/notifications`)
  - [x] 7.4 Implement empty state using `<AppEmptyState ionicon="notifications-outline" message={t('notifications.emptyMessage')} />`
  - [x] 7.5 Implement loading state using `ActivityIndicator` centered on screen while `isLoading` is true and the list is empty
  - [x] 7.6 Replace the placeholder content in `mobile/app/(app)/notifications.tsx` with `<NotificationsScreen />`

- [x] 8. i18n keys
  - [x] 8.1 Add notification keys to `mobile/src/i18n/locales/en.json`: `notifications.title`, `notifications.emptyMessage`, `notifications.markAllRead`, and type label keys for each `NotificationType` value (e.g. `notifications.types.TICKET_CREATED`, etc.)
  - [x] 8.2 Add the same keys to `mobile/src/i18n/locales/ar.json` with Arabic translations

- [x] 9. Build configuration
  - [x] 9.1 Update `mobile/app.json` — add `expo-notifications` to the `plugins` array with `icon: "./assets/images/notification-icon.png"`, `color: "#6366f1"`, `sounds: []`, `androidMode: "default"`; add `"android.googleServicesFile": "./google-services.json"`; verify `ios.bundleIdentifier` is set
  - [x] 9.2 Create or update `mobile/eas.json` with `development` profile (`developmentClient: true`, `distribution: "internal"`, `android.buildType: "apk"`) and `production` profile (`autoIncrement: true`)

- [x] 10. Backend — push token endpoints
  - [x] 10.1 Create a `push_tokens` table migration in `api/drizzle/migrations/` with columns `id` (uuid pk), `userId` (uuid fk → users), `token` (text unique), `platform` (text), `createdAt` (timestamp); run `npm run db:generate` then `npm run db:migrate`
  - [x] 10.2 Create `api/src/modules/notifications/pushTokens/pushTokens.schema.js` with the Drizzle table definition
  - [x] 10.3 Implement `POST /notifications/push-token` controller — authenticates user, upserts token+platform for `userId`, validates that `userId` matches the authenticated user
  - [x] 10.4 Implement `DELETE /notifications/push-token` controller — deletes all push token rows for the authenticated user
  - [x] 10.5 Implement `PATCH /notifications/:id/read` controller — marks the notification as read, validates that the notification belongs to the authenticated user
  - [x] 10.6 Wire the three new routes into the existing notifications router in `api/src/modules/notifications/`

- [x] 11. Backend — Expo Push API sender
  - [x] 11.1 Create `api/src/utils/expoPushSender.js` — exports `sendPushNotifications(messages[])` that batches up to 100 messages per request to `POST https://exp.host/--/api/v2/push/send`
  - [x] 11.2 In `expoPushSender.js`, handle `DeviceNotRegistered` ticket errors by deleting the offending token from the `push_tokens` table
  - [x] 11.3 In `expoPushSender.js`, handle `MessageTooBig` ticket errors by truncating `body` to 256 characters and retrying once
  - [x] 11.4 Integrate `expoPushSender` into the existing `notificationUtils.js` `createNotification` function — after persisting to DB and emitting via socket, also call `sendPushNotifications` for the target user's registered tokens with the correct `NotificationPayload` shape (type, screen, params, channelId derived from notification type)
