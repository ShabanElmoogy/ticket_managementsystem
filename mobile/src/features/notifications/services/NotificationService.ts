/**
 * NotificationService
 *
 * Pure TypeScript singleton class — no JSX, no React hooks.
 * Encapsulates all Expo Notifications API calls, push token lifecycle,
 * listener registration, Android channel configuration, and deep-link
 * navigation triggered by notification taps.
 *
 * Usage:
 *   import { notificationService } from '@/src/features/notifications';
 *
 *   // In app bootstrap (after authentication confirmed):
 *   notificationService.initialize().catch(() => {});
 *
 *   // On logout:
 *   notificationService.cleanup().catch(() => {});
 */

// ⚠️  expo-notifications is NOT imported at the top level.
// Importing it unconditionally causes Expo Go (SDK 53+) to log a hard error
// at module load time — before any isExpoGo() guard can run.
// All calls to expo-notifications go through the lazy `_N()` accessor below.
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useNotificationStore } from '../stores/notificationStore';
import { notificationsApi } from '../api/notifications';
import type {
  NotificationItem,
  NotificationPermissionStatus,
  DeepLinkScreen,
  AndroidChannelId,
} from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Lazy expo-notifications accessor
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotificationsModule = typeof import('expo-notifications');

let _notificationsModule: NotificationsModule | null = null;

/**
 * Returns the expo-notifications module, loading it lazily on first call.
 * This prevents the module from being evaluated at import time in Expo Go,
 * which would trigger the "remote notifications removed from Expo Go" warning.
 */
function _N(): NotificationsModule {
  if (!_notificationsModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _notificationsModule = require('expo-notifications') as NotificationsModule;
  }
  return _notificationsModule;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PUSH_TOKEN_STORAGE_KEY = 'expo_push_token';
const MAX_RETRY_ATTEMPTS     = 3;

// ─────────────────────────────────────────────────────────────────────────────
// NotificationService
// ─────────────────────────────────────────────────────────────────────────────

class NotificationService {
  // ── Private fields ──────────────────────────────────────────────────────────

  private _initialized: boolean = false;

  // Typed as `any` to avoid importing EventSubscription at module level
  // (importing expo-notifications at module level triggers the Expo Go warning)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _foregroundSub: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _responseSub:   any = null;

  /** Stores a pending deep-link target when the app is cold-started via a
   *  notification tap and the navigation stack is not yet ready. */
  private _pendingDeepLink: {
    screen?: DeepLinkScreen;
    params?: Record<string, string>;
  } | null = null;

  // ── Utility methods ─────────────────────────────────────────────────────────

  /**
   * Returns `true` when the app is running inside Expo Go.
   * Push notifications are not supported in Expo Go — only local notifications work.
   */
  isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  /**
   * Returns `true` only when:
   *   - The platform is `ios` or `android`, AND
   *   - The app is NOT running in Expo Go.
   */
  isPushSupported(): boolean {
    const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
    return isNative && !this.isExpoGo();
  }

  // ── Permission management ───────────────────────────────────────────────────

  /**
   * Requests notification permissions from the OS.
   *
   * - iOS: calls `requestPermissionsAsync()` to show the system dialog.
   * - Android: calls `getPermissionsAsync()` (POST_NOTIFICATIONS is handled
   *   automatically by Expo on Android 13+).
   * - Simulator / web / Expo Go: skips and sets status to `'unavailable'`.
   *
   * Stores the result in `notificationStore.permissionStatus`.
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    if (!this.isPushSupported()) {
      if (__DEV__) {
        console.log(
          '[NotificationService] Push notifications are not supported in Expo Go. Use a Development Build.'
        );
      }
      useNotificationStore.getState().setPermissionStatus('unavailable');
      return 'unavailable';
    }

    try {
      let status: NotificationPermissionStatus;

      if (Platform.OS === 'ios') {
        const result = await _N().requestPermissionsAsync();
        status = result.status as NotificationPermissionStatus;
      } else {
        // Android — permissions are requested automatically by Expo
        const result = await _N().getPermissionsAsync();
        status = result.status as NotificationPermissionStatus;
      }

      useNotificationStore.getState().setPermissionStatus(status);

      if (__DEV__) {
        console.log(`[NotificationService] Permission request result: ${status}`);
      }

      return status;
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] requestPermissions() failed:', err);
      useNotificationStore.getState().setPermissionStatus('denied');
      return 'denied';
    }
  }

  // ── Android notification channels ───────────────────────────────────────────

  /**
   * Creates the four Android notification channels.
   * No-op on iOS and web.
   */
  private async _setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    const channels: Array<{ id: AndroidChannelId; name: string; importance: number; vibrationPattern: number[] | null; sound: string | null; enableVibrate: boolean }> = [
      {
        id:               'ticket-updates',
        name:             'Ticket Updates',
        importance:       _N().AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound:            'default',
        enableVibrate:    true,
      },
      {
        id:               'mentions',
        name:             'Mentions & Comments',
        importance:       _N().AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound:            'default',
        enableVibrate:    true,
      },
      {
        id:               'reminders',
        name:             'Reminders',
        importance:       _N().AndroidImportance.DEFAULT,
        vibrationPattern: null,
        sound:            null,
        enableVibrate:    false,
      },
      {
        id:               'general',
        name:             'General',
        importance:       _N().AndroidImportance.LOW,
        vibrationPattern: null,
        sound:            null,
        enableVibrate:    false,
      },
    ];

    for (const channel of channels) {
      await _N().setNotificationChannelAsync(channel.id, channel);
    }
  }

  // ── Push token registration ─────────────────────────────────────────────────

  /**
   * Generates an Expo Push Token and registers it with the backend.
   *
   * - Reads `projectId` from `Constants.expoConfig.extra.eas.projectId`.
   * - Stores the token string in AsyncStorage under `expo_push_token`.
   * - Stores the token in `notificationStore`.
   * - Calls `_registerWithRetry()` to POST the token to the backend.
   */
  async registerPushToken(): Promise<void> {
    if (!this.isPushSupported()) return;

    try {
      const projectId: string | undefined =
        Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        if (__DEV__) {
          console.warn('[NotificationService] No EAS projectId found in app config. Push token registration skipped.');
        }
        return;
      }

      const tokenData = await _N().getExpoPushTokenAsync({ projectId });
      const token     = tokenData.data; // Extract the string from ExpoPushToken object

      // Store token string only — never the full ExpoPushToken object
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      useNotificationStore.getState().setPushToken(token);

      if (__DEV__) {
        console.log('[NotificationService] Push token generated:', token.slice(0, 30) + '...');
      }

      await this._registerWithRetry(token);
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] registerPushToken() failed:', err);
    }
  }

  /**
   * Retries `POST /notifications/push-token` up to `MAX_RETRY_ATTEMPTS` times
   * with exponential backoff (2s, 4s, 8s).
   *
   * Sets `tokenRegistrationFailed` in the store after all retries are exhausted.
   */
  private async _registerWithRetry(token: string, attempt = 1): Promise<void> {
    try {
      await notificationsApi.registerPushToken({
        token,
        platform: Platform.OS as 'ios' | 'android',
      });

      useNotificationStore.getState().setTokenRegistrationFailed(false);

      if (__DEV__) {
        console.log('[NotificationService] Push token registered with backend successfully');
      }
    } catch (err) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        if (__DEV__) {
          console.warn(
            `[NotificationService] Token registration failed (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}), retrying in ${delayMs}ms`
          );
        }
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
        return this._registerWithRetry(token, attempt + 1);
      }

      if (__DEV__) {
        console.error('[NotificationService] Token registration failed after all retries:', err);
      }
      useNotificationStore.getState().setTokenRegistrationFailed(true);
    }
  }

  // ── Foreground notification handler ─────────────────────────────────────────

  /**
   * Handles notifications received while the app is in the foreground.
   *
   * - Maps the raw Expo notification to a `NotificationItem`.
   * - Prepends it to the store (with deduplication).
   * - Updates the badge count.
   * - Shows a toast with the notification title and body.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _handleForegroundNotification = (notification: any): void => {
    try {
      const { title, body, data } = notification.request.content;

      if (__DEV__) {
        console.log('[NotificationService] Notification received in foreground:', title);
      }

      // Map to NotificationItem
      const item: NotificationItem = {
        id:        notification.request.identifier,
        type:      (data?.type as NotificationItem['type']) ?? 'TICKET_UPDATED',
        title:     title ?? '',
        message:   body  ?? '',
        read:      false,
        createdAt: new Date().toISOString(),
        data: {
          screen:   data?.screen   as DeepLinkScreen | undefined,
          params:   data?.params   as Record<string, string> | undefined,
          ticketId: data?.ticketId as string | undefined,
        },
      };

      useNotificationStore.getState().prependNotification(item);

      // Update badge count
      const { unreadCount } = useNotificationStore.getState();
      _N().setBadgeCountAsync(unreadCount).catch(() => {});

      // Show in-app toast
      Toast.show({
        type:  'info',
        text1: title ?? 'New notification',
        text2: body  ?? undefined,
      });
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] _handleForegroundNotification failed:', err);
    }
  };

  // ── Notification response handler ───────────────────────────────────────────

  /**
   * Handles user taps on notifications from any app state
   * (foreground, background, or killed).
   *
   * - Extracts `screen` and `params` from the notification data.
   * - Marks the notification as read on the backend.
   * - Navigates to the deep-link target.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _handleNotificationResponse = (response: any): void => {
    try {
      const { identifier, content } = response.notification.request;
      const data = content.data ?? {};

      const screen = data.screen as DeepLinkScreen | undefined;
      const params = data.params as Record<string, string> | undefined;

      if (__DEV__) {
        console.log('[NotificationService] Notification tapped:', identifier, '→', screen);
      }

      // Mark as read on the backend (fire-and-forget)
      this.markAsRead(identifier).catch(() => {});

      // Navigate to the deep-link target
      this._navigate(screen, params);
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] _handleNotificationResponse failed:', err);
    }
  };

  // ── Deep-link navigation ────────────────────────────────────────────────────

  /**
   * Navigates to the screen specified by the notification deep-link target.
   *
   * Routes:
   *   `ticket-detail` → `/(app)/ticket/[id]` with `ticketId` param
   *   `dashboard`     → `/(app)/index`
   *   `notifications` → `/(app)/notifications`
   *   (fallback)      → `/(app)/notifications`
   *
   * Wraps in try/catch and falls back to the notifications screen on error.
   */
  private _navigate(
    screen?: DeepLinkScreen,
    params?: Record<string, string>
  ): void {
    try {
      switch (screen) {
        case 'ticket-detail':
          if (params?.ticketId) {
            router.push({
              pathname: '/(app)/tickets' as any,
              params:   { id: params.ticketId },
            });
          } else {
            router.push('/(app)/notifications');
          }
          break;

        case 'dashboard':
          router.push('/(app)/index' as any);
          break;

        case 'notifications':
        default:
          router.push('/(app)/notifications');
          break;
      }
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] Navigation failed:', err);
      try {
        router.push('/(app)/notifications');
      } catch {
        // Ignore secondary navigation failure
      }
    }
  }

  // ── Killed-app cold start ───────────────────────────────────────────────────

  /**
   * Checks if the app was opened by tapping a notification (killed-app cold start).
   *
   * - If a response exists and `navigationReady` is true → navigates immediately.
   * - Otherwise stores the pending deep-link and subscribes to the store until
   *   `navigationReady` becomes true, then navigates and unsubscribes.
   */
  private async _checkInitialNotification(): Promise<void> {
    try {
      const response = await _N().getLastNotificationResponseAsync();
      if (!response) return;

      const data   = response.notification.request.content.data ?? {};
      const screen = data.screen as DeepLinkScreen | undefined;
      const params = data.params as Record<string, string> | undefined;

      const { navigationReady } = useNotificationStore.getState();

      if (navigationReady) {
        this._navigate(screen, params);
        return;
      }

      // Store pending deep-link and wait for navigation to be ready
      this._pendingDeepLink = { screen, params };

      const unsubscribe = useNotificationStore.subscribe((state) => {
        if (state.navigationReady && this._pendingDeepLink) {
          const { screen: s, params: p } = this._pendingDeepLink;
          this._pendingDeepLink = null;
          unsubscribe();
          this._navigate(s, p);
        }
      });
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] _checkInitialNotification() failed:', err);
    }
  }

  // ── Unread count sync ───────────────────────────────────────────────────────

  /**
   * Fetches the current unread count from the backend and syncs it to the store.
   */
  private async _syncUnreadCount(): Promise<void> {
    try {
      const result = await notificationsApi.getUnreadCount();
      useNotificationStore.getState().setUnreadCount(result.count);
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] _syncUnreadCount() failed:', err);
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Initializes the notification system.
   *
   * Idempotent — safe to call multiple times; subsequent calls are no-ops.
   *
   * Sequence:
   *   1. Setup Android channels (no-op on iOS)
   *   2. Configure foreground display handler
   *   3. Register foreground + response listeners
   *   4. Request permissions
   *   5. Register push token (if permissions granted and push is supported)
   *   6. Sync unread count from backend
   *   7. Check for killed-app notification tap
   *
   * Never re-throws — notification failures must not crash the app.
   */
  async initialize(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    if (__DEV__) console.log('[NotificationService] Initializing...');

    try {
      // 1. Android channels (no-op on iOS/web)
      await this._setupAndroidChannels();

      // 2. Foreground display config
      _N().setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert:  true,
          shouldPlaySound:  true,
          shouldSetBadge:   true,
          shouldShowBanner: true,
          shouldShowList:   true,
        }),
      });

      // 3. Register listeners
      this._foregroundSub = _N().addNotificationReceivedListener(
        this._handleForegroundNotification
      );
      this._responseSub = _N().addNotificationResponseReceivedListener(
        this._handleNotificationResponse
      );

      // 4. Permissions
      const status = await this.requestPermissions();

      // 5. Push token (only when permissions granted and push is supported)
      if (status === 'granted' && this.isPushSupported()) {
        await this.registerPushToken();
      }

      // 6. Sync unread count
      await this._syncUnreadCount();

      // 7. Handle killed-app tap
      await this._checkInitialNotification();

      if (__DEV__) console.log('[NotificationService] Initialized successfully');
    } catch (err) {
      // Reset initialized flag so a retry is possible if needed
      this._initialized = false;
      console.error('[NotificationService] initialize() failed:', err);
      // Never re-throw — notification failure must not crash the app
    }
  }

  // ── Notification actions ────────────────────────────────────────────────────

  /**
   * Marks a single notification as read on the backend and in the store.
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await notificationsApi.markAsRead(id);
      useNotificationStore.getState().markAsRead(id);
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] markAsRead() failed:', err);
    }
  }

  /**
   * Marks all notifications as read on the backend, clears the badge count,
   * and updates the store.
   */
  async markAllAsRead(): Promise<void> {
    try {
      await notificationsApi.markAllAsRead();
      useNotificationStore.getState().markAllAsRead();
      await _N().setBadgeCountAsync(0);
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] markAllAsRead() failed:', err);
    }
  }

  // ── Local notifications ─────────────────────────────────────────────────────

  /**
   * Schedules a local notification for a future date.
   *
   * @param title       - Notification title
   * @param body        - Notification body text
   * @param triggerDate - Must be in the future; throws if not
   * @param data        - Optional extra data attached to the notification
   * @param channelId   - Android channel (defaults to `'reminders'`)
   * @returns           The notification identifier string for later cancellation
   * @throws            `Error('Trigger date must be in the future')` if triggerDate is in the past
   */
  async scheduleLocalNotification(
    title:       string,
    body:        string,
    triggerDate: Date,
    data?:       Record<string, unknown>,
    channelId?:  AndroidChannelId
  ): Promise<string> {
    if (triggerDate <= new Date()) {
      throw new Error('Trigger date must be in the future');
    }

    const identifier = await _N().scheduleNotificationAsync({
      content: {
        title,
        body,
        data:      data ?? {},
        sound:     'default',
        ...(Platform.OS === 'android' && { channelId: channelId ?? 'reminders' }),
      },
      trigger: {
        type: _N().SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return identifier;
  }

  /**
   * Cancels a previously scheduled local notification by its identifier.
   */
  async cancelLocalNotification(identifier: string): Promise<void> {
    try {
      await _N().cancelScheduledNotificationAsync(identifier);
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] cancelLocalNotification() failed:', err);
    }
  }

  /**
   * Cancels all scheduled local notifications.
   */
  async cancelAllLocalNotifications(): Promise<void> {
    try {
      await _N().cancelAllScheduledNotificationsAsync();
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] cancelAllLocalNotifications() failed:', err);
    }
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  /**
   * Opens the device notification settings for this app.
   */
  openNotificationSettings(): void {
    Linking.openSettings();
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  /**
   * Cleans up the notification system on logout.
   *
   * - Deletes the push token from the backend.
   * - Removes the token from AsyncStorage.
   * - Removes all event listeners.
   * - Resets the store.
   * - Resets the `_initialized` flag so `initialize()` can be called again
   *   after the next login.
   */
  async cleanup(): Promise<void> {
    if (__DEV__) console.log('[NotificationService] Cleaning up...');

    try {
      // Delete push token from backend
      await notificationsApi.deletePushToken();
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] cleanup() — deletePushToken failed:', err);
    }

    try {
      // Remove token from AsyncStorage
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    } catch (err) {
      if (__DEV__) console.error('[NotificationService] cleanup() — AsyncStorage.removeItem failed:', err);
    }

    // Remove listeners
    this._foregroundSub?.remove();
    this._responseSub?.remove();
    this._foregroundSub = null;
    this._responseSub   = null;

    // Clear pending deep-link
    this._pendingDeepLink = null;

    // Reset store
    useNotificationStore.getState().reset();
    useNotificationStore.getState().clearUnreadCount();

    // Reset initialized flag so initialize() can be called again after next login
    this._initialized = false;

    if (__DEV__) console.log('[NotificationService] Cleanup complete');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton export
// ─────────────────────────────────────────────────────────────────────────────

export const notificationService = new NotificationService();
