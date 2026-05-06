# Requirements Document

## Introduction

This document defines the requirements for a production-ready push notification system for the TicketFlow mobile app (Expo SDK ~54, React Native 0.81, Android + iOS). The system must handle permission management, Expo Push Token lifecycle, local and remote push notifications, foreground/background/killed-app delivery, Android notification channels, badge count management, and deep-link navigation. It must integrate cleanly with the existing Socket.IO real-time layer, Zustand state management, React Query data layer, and the `BaseApiService` / `httpClient` infrastructure already in place.

---

## Glossary

- **NotificationService**: The singleton TypeScript class that encapsulates all Expo Notifications API calls, token management, listener registration, and channel configuration.
- **NotificationStore**: The Zustand store that holds notification state (unread count, notification list, permission status, push token) and exposes actions consumed by UI components.
- **PushToken**: The Expo Push Token string (format `ExponentPushToken[...]`) generated per device per app installation and stored securely in AsyncStorage and synced to the backend.
- **NotificationChannel**: An Android-specific notification category (e.g. `ticket-updates`, `mentions`) that groups notifications with shared sound, vibration, and importance settings.
- **NotificationPayload**: The structured JSON object sent by the backend via the Expo Push API, containing `title`, `body`, `data.screen`, `data.params`, and `data.type` fields.
- **DeepLinkTarget**: A screen name and optional params object derived from a notification tap, used to navigate the user to the relevant screen.
- **ForegroundHandler**: A listener registered via `Notifications.addNotificationReceivedListener` that processes notifications arriving while the app is in the foreground.
- **ResponseHandler**: A listener registered via `Notifications.addNotificationResponseReceivedListener` that processes user taps on notifications regardless of app state.
- **BadgeCount**: The numeric badge displayed on the app icon (iOS) and the notification bell icon (in-app) representing unread notifications.
- **DevelopmentBuild**: An Expo development build (EAS Build) required for testing push notifications on a physical device; Expo Go does not support push notifications.
- **EASBuild**: Expo Application Services build pipeline used to produce development and production builds with the correct native push notification entitlements.
- **LocalNotification**: A notification scheduled and displayed entirely on-device without a backend round-trip, used for reminders and offline-safe alerts.
- **RemotePushNotification**: A notification delivered via the Expo Push API from the backend server to a device identified by its PushToken.
- **NotificationPermissionStatus**: The result of `Notifications.getPermissionsAsync()` — one of `granted`, `denied`, or `undetermined`.
- **useNotifications**: The React hook that exposes NotificationStore state and NotificationService actions to UI components.
- **NotificationItem**: A single notification record with `id`, `type`, `title`, `message`, `read`, `createdAt`, and optional `data` fields.

---

## Requirements

### Requirement 1: Permission Management

**User Story:** As a user, I want to be asked for notification permissions when I first open the app, so that I can receive timely alerts about my tickets and mentions.

#### Acceptance Criteria

1. WHEN the app starts and the user is authenticated, THE NotificationService SHALL request notification permissions using `Notifications.requestPermissionsAsync()` on iOS and `Notifications.getPermissionsAsync()` on Android.
2. WHEN the permission status is `undetermined`, THE NotificationService SHALL present the system permission dialog to the user exactly once per app installation.
3. WHEN the permission status is `denied`, THE NotificationService SHALL log the denial, store the status in NotificationStore, and skip all subsequent token registration attempts for the current session.
4. WHEN the permission status is `granted`, THE NotificationService SHALL proceed immediately to token registration (Requirement 2).
5. IF the device is a simulator or web platform, THEN THE NotificationService SHALL skip permission requests and log a warning without throwing an error.
6. THE NotificationStore SHALL expose a `permissionStatus` field of type `NotificationPermissionStatus` that reflects the current permission state.
7. WHEN the user navigates to the app settings screen, THE NotificationService SHALL provide a `openNotificationSettings()` method that calls `Linking.openSettings()` to allow the user to change permissions manually.

---

### Requirement 2: Push Token Generation and Storage

**User Story:** As a backend engineer, I want each device to register a unique Expo Push Token, so that I can send targeted push notifications to specific users.

#### Acceptance Criteria

1. WHEN notification permissions are `granted`, THE NotificationService SHALL call `Notifications.getExpoPushTokenAsync({ projectId })` using the `projectId` from `expo-constants` (`Constants.expoConfig.extra.eas.projectId`).
2. WHEN a PushToken is successfully generated, THE NotificationService SHALL store it in AsyncStorage under the key `expo_push_token`.
3. WHEN a PushToken is successfully generated, THE NotificationService SHALL call `POST /notifications/push-token` on the backend with the token string and platform (`ios` or `android`) within 5 seconds of generation.
4. WHEN the backend registration call fails with a network error, THE NotificationService SHALL retry the registration up to 3 times with exponential backoff starting at 2 seconds.
5. WHEN the app starts and a PushToken already exists in AsyncStorage, THE NotificationService SHALL re-register it with the backend to handle token rotation without requesting a new token.
6. IF the device is running Android API level 33 or higher, THEN THE NotificationService SHALL request `POST_NOTIFICATIONS` permission via `PermissionsAndroid.request` before calling `getExpoPushTokenAsync`.
7. THE NotificationStore SHALL expose a `pushToken` field of type `string | null` that reflects the current registered token.
8. WHEN the user logs out, THE NotificationService SHALL call `DELETE /notifications/push-token` on the backend and clear the token from AsyncStorage and NotificationStore.

---

### Requirement 3: Android Notification Channels

**User Story:** As an Android user, I want notifications grouped into meaningful categories with appropriate sounds and vibration, so that I can distinguish urgent ticket alerts from general updates.

#### Acceptance Criteria

1. WHEN the app initializes on Android, THE NotificationService SHALL create a notification channel with id `ticket-updates`, name `Ticket Updates`, importance `HIGH`, vibration enabled, and the default notification sound.
2. WHEN the app initializes on Android, THE NotificationService SHALL create a notification channel with id `mentions`, name `Mentions & Comments`, importance `HIGH`, vibration enabled, and the default notification sound.
3. WHEN the app initializes on Android, THE NotificationService SHALL create a notification channel with id `reminders`, name `Reminders`, importance `DEFAULT`, vibration disabled, and no sound.
4. WHEN the app initializes on Android, THE NotificationService SHALL create a notification channel with id `general`, name `General`, importance `LOW`, vibration disabled, and no sound.
5. THE NotificationService SHALL call `Notifications.setNotificationChannelAsync` for each channel exactly once per app session, guarded by a `Platform.OS === 'android'` check.
6. WHEN a RemotePushNotification payload includes a `channelId` field, THE NotificationService SHALL use that value; otherwise THE NotificationService SHALL default to the `ticket-updates` channel.

---

### Requirement 4: Foreground Notification Handling

**User Story:** As a user actively using the app, I want to see an in-app notification banner when a new notification arrives, so that I don't miss important updates while working.

#### Acceptance Criteria

1. WHEN the app is in the foreground and a notification is received, THE NotificationService SHALL invoke the registered ForegroundHandler with the full `Notifications.Notification` object.
2. THE NotificationService SHALL call `Notifications.setNotificationHandler` with a handler that returns `{ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }` for all incoming notifications.
3. WHEN a foreground notification is received, THE NotificationStore SHALL increment `unreadCount` by 1 and prepend the new NotificationItem to the `notifications` array, capped at 50 items.
4. WHEN a foreground notification is received, THE NotificationService SHALL trigger a toast notification using the existing `react-native-toast-message` infrastructure with the notification title and body.
5. THE NotificationService SHALL register the ForegroundHandler using `Notifications.addNotificationReceivedListener` and store the subscription reference for cleanup.
6. WHEN the NotificationService is destroyed or the user logs out, THE NotificationService SHALL call `.remove()` on all stored subscription references to prevent memory leaks.

---

### Requirement 5: Background and Killed-App Notification Handling

**User Story:** As a user who is not actively using the app, I want to receive push notifications in the notification tray, so that I can stay informed about ticket activity even when the app is closed.

#### Acceptance Criteria

1. WHEN the app is in the background or killed state and a RemotePushNotification is delivered, THE operating system SHALL display the notification in the system notification tray using the `title` and `body` fields from the NotificationPayload.
2. WHEN the user taps a notification from the background state, THE NotificationService SHALL process the tap via the ResponseHandler and navigate to the DeepLinkTarget screen specified in `notification.request.content.data.screen`.
3. WHEN the user taps a notification from the killed state, THE NotificationService SHALL read the initial notification via `Notifications.getLastNotificationResponseAsync()` on app startup and navigate to the DeepLinkTarget screen after the navigation stack is ready.
4. THE NotificationService SHALL register the ResponseHandler using `Notifications.addNotificationResponseReceivedListener` and store the subscription reference for cleanup.
5. WHEN a notification is tapped from any app state, THE NotificationService SHALL mark the corresponding notification as read by calling `PATCH /notifications/:id/read` on the backend.

---

### Requirement 6: Notification Icon, Sound, and Vibration

**User Story:** As a user, I want notifications to have a recognizable icon, sound, and vibration pattern, so that I can identify TicketFlow notifications at a glance.

#### Acceptance Criteria

1. THE NotificationService SHALL configure a custom notification icon for Android by setting `notification.icon` in `app.json` to a monochrome PNG asset at `./assets/images/notification-icon.png`.
2. THE NotificationService SHALL configure a notification color for Android by setting `notification.color` in `app.json` to the app's primary brand color (`#6366f1`).
3. WHEN a notification is displayed on iOS, THE operating system SHALL use the app icon as the notification icon (iOS default behavior — no additional configuration required).
4. WHEN a notification is delivered to a channel with sound enabled, THE operating system SHALL play the default system notification sound.
5. WHEN a notification is delivered to a channel with vibration enabled, THE operating system SHALL trigger the default vibration pattern.
6. WHERE the `expo-notifications` `sound` field is set in the NotificationPayload, THE NotificationService SHALL use that sound; otherwise THE NotificationService SHALL use the channel default.

---

### Requirement 7: Deep Link Navigation

**User Story:** As a user, I want tapping a notification to take me directly to the relevant screen, so that I can act on ticket updates without manually navigating.

#### Acceptance Criteria

1. WHEN a notification is tapped and `data.screen` is `'ticket-detail'`, THE NotificationService SHALL navigate to the ticket detail screen passing `data.params.ticketId` as a route parameter.
2. WHEN a notification is tapped and `data.screen` is `'notifications'`, THE NotificationService SHALL navigate to the notifications list screen.
3. WHEN a notification is tapped and `data.screen` is `'dashboard'`, THE NotificationService SHALL navigate to the dashboard screen.
4. WHEN a notification is tapped and `data.screen` is absent or unrecognized, THE NotificationService SHALL navigate to the notifications list screen as a safe fallback.
5. THE NotificationService SHALL use the `expo-router` `router.push()` API for all navigation triggered by notification taps.
6. WHEN the navigation stack is not yet ready (killed-app cold start), THE NotificationService SHALL defer navigation until the root layout signals readiness via a `navigationReady` flag in NotificationStore.
7. IF navigation to the DeepLinkTarget fails due to an invalid route, THEN THE NotificationService SHALL log the error and navigate to the notifications list screen instead.

---

### Requirement 8: Badge Count Management

**User Story:** As a user, I want to see an unread badge count on the app icon and notification bell, so that I know how many unread notifications I have without opening the app.

#### Acceptance Criteria

1. WHEN a new notification is received in any app state, THE NotificationService SHALL call `Notifications.setBadgeCountAsync(count)` with the current `unreadCount` from NotificationStore.
2. WHEN the user opens the notifications screen, THE NotificationService SHALL call `Notifications.setBadgeCountAsync(0)` and set `unreadCount` to `0` in NotificationStore.
3. WHEN the user opens the notifications screen, THE NotificationService SHALL call `POST /notifications/read-all` on the backend to mark all notifications as read.
4. WHEN the app starts and the user is authenticated, THE NotificationService SHALL call `GET /notifications/count` to fetch the current unread count from the backend and sync it to NotificationStore.
5. THE NotificationStore SHALL expose an `unreadCount` field of type `number` initialized to `0`.
6. WHEN `unreadCount` changes, THE NotificationStore SHALL persist the value to AsyncStorage under the key `notification_unread_count` so it survives app restarts.

---

### Requirement 9: Local Notifications

**User Story:** As a user, I want to receive local reminders for upcoming ticket due dates even when the backend is unreachable, so that I never miss a deadline.

#### Acceptance Criteria

1. THE NotificationService SHALL expose a `scheduleLocalNotification(title, body, triggerDate, data)` method that calls `Notifications.scheduleNotificationAsync` with a `DateTriggerInput`.
2. WHEN `scheduleLocalNotification` is called with a `triggerDate` in the past, THE NotificationService SHALL throw an `Error` with message `'Trigger date must be in the future'`.
3. THE NotificationService SHALL expose a `cancelLocalNotification(identifier)` method that calls `Notifications.cancelScheduledNotificationAsync`.
4. THE NotificationService SHALL expose a `cancelAllLocalNotifications()` method that calls `Notifications.cancelAllScheduledNotificationsAsync`.
5. WHEN a local notification is scheduled, THE NotificationService SHALL return the notification identifier string for later cancellation.
6. WHERE the `channelId` parameter is provided to `scheduleLocalNotification`, THE NotificationService SHALL assign the notification to that Android channel; otherwise THE NotificationService SHALL use the `reminders` channel.

---

### Requirement 10: Remote Push Notification Integration

**User Story:** As a backend engineer, I want to send push notifications to users via the Expo Push API, so that users receive real-time alerts about ticket events on their devices.

#### Acceptance Criteria

1. THE backend SHALL send push notifications by calling `POST https://exp.host/--/api/v2/push/send` with a JSON body containing `to` (PushToken), `title`, `body`, `data`, `sound`, `badge`, and `channelId` fields.
2. WHEN the Expo Push API returns a `DeviceNotRegistered` error for a token, THE backend SHALL delete that token from the database and stop sending to it.
3. WHEN the Expo Push API returns a `MessageTooBig` error, THE backend SHALL truncate the `body` field to 256 characters and retry once.
4. THE backend push notification sender SHALL batch up to 100 notifications per Expo Push API request to respect the Expo rate limit.
5. WHEN a RemotePushNotification is received by the device, THE `data` field SHALL contain `type` (matching a `SOCKET.NOTIFICATION_TYPES` value), `screen` (DeepLinkTarget screen name), and optionally `params` (route parameters) and `ticketId`.
6. THE NotificationPayload `data.type` field SHALL use the same `NotificationType` values defined in `SOCKET.NOTIFICATION_TYPES` to ensure consistency between socket and push notification events.

---

### Requirement 11: NotificationService Architecture

**User Story:** As a developer, I want a clean, reusable NotificationService abstraction, so that notification logic is centralized, testable, and does not leak into UI components.

#### Acceptance Criteria

1. THE NotificationService SHALL be implemented as a TypeScript class exported as a singleton instance `notificationService` from `mobile/src/features/notifications/services/NotificationService.ts`.
2. THE NotificationService SHALL expose the following public methods: `initialize()`, `requestPermissions()`, `registerPushToken()`, `scheduleLocalNotification()`, `cancelLocalNotification()`, `cancelAllLocalNotifications()`, `openNotificationSettings()`, `markAsRead(id)`, `markAllAsRead()`, `cleanup()`.
3. THE NotificationService SHALL not import from any React component or hook — it SHALL be a pure TypeScript class with no JSX dependencies.
4. THE NotificationStore SHALL be implemented as a Zustand store in `mobile/src/features/notifications/stores/notificationStore.ts` following the existing store pattern in `mobile/src/stores/`.
5. THE `useNotifications` hook SHALL be implemented in `mobile/src/features/notifications/hooks/useNotifications.ts` and SHALL expose `{ notifications, unreadCount, permissionStatus, pushToken, markAsRead, markAllAsRead, clearAll }`.
6. WHEN `NotificationService.initialize()` is called more than once in the same session, THE NotificationService SHALL be idempotent — it SHALL skip re-registration and re-listener setup without throwing an error.
7. THE NotificationService SHALL use the existing `BaseApiService` subclass pattern for all backend API calls, implemented as `NotificationsApiService` in `mobile/src/features/notifications/api/notifications.ts`.

---

### Requirement 12: Error Handling and Logging

**User Story:** As a developer, I want all notification errors to be logged and handled gracefully, so that notification failures never crash the app or degrade the user experience.

#### Acceptance Criteria

1. WHEN any `Notifications.*` API call throws an error, THE NotificationService SHALL catch the error, log it with `console.error('[NotificationService]', error)` in development, and continue operation without re-throwing.
2. WHEN the backend push token registration fails after all retries, THE NotificationService SHALL store a `tokenRegistrationFailed` flag in NotificationStore and surface a non-blocking warning in the app settings screen.
3. WHEN navigation from a notification tap fails, THE NotificationService SHALL catch the navigation error, log it, and navigate to the notifications list screen as a fallback.
4. IF the device does not support push notifications (e.g. simulator, web), THEN THE NotificationService SHALL set `permissionStatus` to `'unavailable'` in NotificationStore and disable all push-related functionality without throwing.
5. THE NotificationService SHALL wrap all async operations in try/catch blocks and SHALL NOT propagate unhandled promise rejections to the global error handler.
6. WHEN operating in development mode (`__DEV__ === true`), THE NotificationService SHALL log all lifecycle events (permission request, token registration, notification received, notification tapped) with a `[NotificationService]` prefix.

---

### Requirement 13: Expo Go vs Development Build Compatibility

**User Story:** As a developer, I want clear runtime behavior differences between Expo Go and Development Builds documented and enforced in code, so that the team understands testing limitations.

#### Acceptance Criteria

1. WHEN the app is running in Expo Go (`Constants.appOwnership === 'expo'`), THE NotificationService SHALL skip push token registration, log a warning `'Push notifications are not supported in Expo Go. Use a Development Build.'`, and set `permissionStatus` to `'unavailable'`.
2. WHEN the app is running in a Development Build or production build, THE NotificationService SHALL proceed with full push notification initialization.
3. THE NotificationService SHALL expose an `isExpoGo()` utility method that returns `true` when `Constants.appOwnership === 'expo'`.
4. THE NotificationService SHALL expose an `isPushSupported()` utility method that returns `true` only when the platform is `ios` or `android` AND the app is not running in Expo Go.
5. WHERE local notifications are requested in Expo Go, THE NotificationService SHALL allow them (local notifications work in Expo Go) and SHALL NOT block them.

---

### Requirement 14: EAS Build Configuration

**User Story:** As a developer, I want the EAS build configuration to include all required push notification entitlements, so that production builds receive push notifications correctly.

#### Acceptance Criteria

1. THE `eas.json` file SHALL define a `development` profile with `developmentClient: true` and `distribution: 'internal'` for testing push notifications on physical devices.
2. THE `eas.json` file SHALL define a `production` profile with `autoIncrement: true` for App Store and Play Store submissions.
3. THE `app.json` file SHALL include `"expo-notifications"` in the `plugins` array with `icon`, `color`, `sounds`, and `androidMode` fields configured.
4. THE `app.json` file SHALL include `"android.googleServicesFile": "./google-services.json"` pointing to the Firebase Cloud Messaging configuration file required for Android push notifications via Expo.
5. THE `app.json` file SHALL include `"ios.bundleIdentifier"` set to the production bundle ID to ensure APNs certificates are correctly associated.

---

### Requirement 15: Notifications Screen

**User Story:** As a user, I want a dedicated notifications screen that lists all my notifications with read/unread status, so that I can review and manage my notification history.

#### Acceptance Criteria

1. THE Notifications_Screen SHALL display a scrollable list of NotificationItem records fetched from `GET /notifications` sorted by `createdAt` descending.
2. WHEN the Notifications_Screen mounts, THE Notifications_Screen SHALL call `NotificationService.markAllAsRead()` to clear the badge count and mark all notifications as read.
3. WHEN a NotificationItem is tapped, THE Notifications_Screen SHALL call `NotificationService.markAsRead(id)` and navigate to the DeepLinkTarget screen specified in `item.data.screen`.
4. WHEN the notifications list is empty, THE Notifications_Screen SHALL display an empty state using the existing `AppEmptyState` component with `ionicon="notifications-outline"`.
5. WHILE notifications are loading, THE Notifications_Screen SHALL display a loading indicator using the existing `ActivityIndicator` pattern.
6. THE Notifications_Screen SHALL display unread notifications with a distinct visual treatment (bold title, colored left border using `c.interactive.primary`) and read notifications with muted styling (`c.text.muted`).
7. WHEN the user pulls down on the notifications list, THE Notifications_Screen SHALL trigger a refetch of notifications from the backend.
8. THE Notifications_Screen SHALL be accessible from the app header notification bell icon and from the bottom tab navigation.

---

### Requirement 16: Performance and Security

**User Story:** As a developer, I want the notification system to be performant and secure, so that it does not degrade app startup time or expose sensitive data.

#### Acceptance Criteria

1. THE NotificationService SHALL complete its `initialize()` call within 3 seconds on a device with a stable network connection, measured from the start of `initialize()` to the completion of push token backend registration.
2. THE NotificationService SHALL register at most one ForegroundHandler and one ResponseHandler per app session — duplicate listener registration SHALL be prevented by checking an `_initialized` boolean flag.
3. WHEN storing the PushToken in AsyncStorage, THE NotificationService SHALL store only the token string — it SHALL NOT store the full `ExpoPushToken` object or any user credentials alongside it.
4. THE NotificationPayload `data` field SHALL NOT contain sensitive user data such as passwords, full ticket descriptions, or PII beyond the ticket ID and title.
5. THE backend SHALL validate that the `userId` associated with a PushToken matches the authenticated user before sending a notification to that token.
6. THE NotificationService SHALL not retain references to notification payloads beyond the current session — the `notifications` array in NotificationStore SHALL be cleared on logout.
