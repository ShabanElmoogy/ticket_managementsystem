import * as Network from 'expo-network';
import { Platform } from 'react-native';
import type { AxiosRequestConfig } from 'axios';
import type { ErrorReason } from '@/src/components/NetworkErrorDialog/types';

/**
 * Lightweight event bus + offline retry queue.
 *
 * Flow:
 *   1. httpClient interceptor calls networkEvents.emit() on network error
 *   2. NetworkErrorDialog subscribes via onError() to show the dialog
 *   3. httpClient interceptor calls networkEvents.enqueue() to save the failed request
 *   4. networkEvents watches connectivity — when restored, drains the queue
 *   5. Each queued request is retried via the retry callback
 *   6. onRetrySuccess listeners are notified (e.g. to show a toast)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

type NetworkErrorListener   = (message: string) => void;
type ApiErrorListener       = (status: number, message: string, details?: unknown, reason?: ErrorReason) => void;
type RetrySuccessListener   = (count: number) => void;
type OkPressListener        = () => void;
type RetryCallback          = (config: AxiosRequestConfig) => Promise<unknown>;
type ConnectivityCallback   = () => void;

interface QueuedRequest {
  config:   AxiosRequestConfig;
  resolve:  (value: unknown) => void;
  reject:   (reason: unknown) => void;
}

// ── State ─────────────────────────────────────────────────────────────────────

const errorListeners:        Set<NetworkErrorListener> = new Set();
const apiErrorListeners:     Set<ApiErrorListener>     = new Set();
const retrySuccessListeners: Set<RetrySuccessListener> = new Set();
const okPressListeners:      Set<OkPressListener>      = new Set();
const queue:                 QueuedRequest[]           = [];

let retryCallback:        RetryCallback        | null = null;
let connectivityCallback: ConnectivityCallback | null = null;
let isWatching:       boolean              = false;
let isOnline:         boolean              = true;
let networkSub:       { remove: () => void } | null = null;

// ── Public API ────────────────────────────────────────────────────────────────

export const networkEvents = {
  // ── Error notifications ───────────────────────────────────────────────────

  /** Subscribe to network errors (for dialog/toast display) */
  onError: (fn: NetworkErrorListener) => {
    errorListeners.add(fn);
    return () => errorListeners.delete(fn);
  },

  /** Emit a network error to all subscribers */
  emit: (message: string) => {
    errorListeners.forEach((fn) => fn(message));
  },

  // ── API error notifications ───────────────────────────────────────────────

  /** Subscribe to API errors (4xx/5xx responses) */
  onApiError: (fn: ApiErrorListener) => {
    apiErrorListeners.add(fn);
    return () => apiErrorListeners.delete(fn);
  },

  /** Emit an API error (called by httpClient for non-network errors) */
  emitApiError: (status: number, message: string, details?: unknown, reason?: ErrorReason) => {
    apiErrorListeners.forEach((fn) => fn(status, message, details, reason));
  },

  // ── Retry queue ───────────────────────────────────────────────────────────

  /**
   * Register the retry callback — called by httpClient on init.
   * The callback receives an AxiosRequestConfig and re-executes it.
   */
  setRetryCallback: (cb: RetryCallback) => {
    retryCallback = cb;
  },

  /** Register a callback fired when connectivity is restored (used by httpClient for 401 queue). */
  setConnectivityCallback: (cb: ConnectivityCallback) => {
    connectivityCallback = cb;
  },

  /**
   * Enqueue a failed request for retry when connectivity is restored.
   * Returns a Promise that resolves/rejects when the retry completes.
   */
  enqueue: (config: AxiosRequestConfig): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const key = `${config.method?.toUpperCase()}:${config.url}`;
      const isDuplicate = queue.some(
        (q) => `${q.config.method?.toUpperCase()}:${q.config.url}` === key
      );
      queue.push({ config, resolve, reject });
      if (__DEV__) {
        console.log(
          `\n📥 [RetryQueue] ─────────────────────────────────────`,
          `\n   Action  : ENQUEUE`,
          `\n   Request : ${config.method?.toUpperCase()} ${config.url}`,
          `\n   Duplicate: ${isDuplicate ? 'YES — will be merged on drain' : 'no'}`,
          `\n   Queue   : ${queue.length} pending`,
          `\n   Online  : ${isOnline}`,
          `\n─────────────────────────────────────────────────────\n`,
        );
      }
    });
  },

  /** How many requests are waiting to be retried */
  queueLength: () => queue.length,

  // ── Retry success notifications ───────────────────────────────────────────

  /** Subscribe to be notified when queued requests are retried successfully */
  onRetrySuccess: (fn: RetrySuccessListener) => {
    retrySuccessListeners.add(fn);
    return () => retrySuccessListeners.delete(fn);
  },

  // ── OK press notification ─────────────────────────────────────────────────

  /**
   * Subscribe to be notified when the user presses OK on the error dialog.
   * Use this to trigger follow-up actions (e.g. open force-delete dialog)
   * only after the user has acknowledged the error.
   */
  onOkPress: (fn: OkPressListener) => {
    okPressListeners.add(fn);
    return () => okPressListeners.delete(fn);
  },

  /** Emit OK press — called by NetworkErrorDialog when user presses OK */
  emitOkPress: () => {
    okPressListeners.forEach((fn) => fn());
  },

  // ── Connectivity watcher ──────────────────────────────────────────────────

  /**
   * Start watching network connectivity.
   * Call once from the root layout on app start.
   */
  startWatching: () => {
    if (isWatching) return;
    isWatching = true;

    // expo-network native APIs not available on web
    if (Platform.OS === 'web') return;

    Network.getNetworkStateAsync().then((state) => {
      isOnline = !!(state.isConnected && state.isInternetReachable);
    }).catch(() => {});

    networkSub = Network.addNetworkStateListener((state) => {
      const wasOffline = !isOnline;
      const prevOnline = isOnline;
      isOnline = !!(state.isConnected && state.isInternetReachable);

      if (__DEV__) {
        console.log(
          `\n🌐 [Network] ─────────────────────────────────────────`,
          `\n   Status  : ${isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`,
          `\n   Previous: ${prevOnline ? 'online' : 'offline'}`,
          `\n   Transition: ${wasOffline && isOnline ? '⬆️  OFFLINE → ONLINE (will drain queue)' : !wasOffline && !isOnline ? '⬇️  ONLINE → OFFLINE (requests will queue)' : 'no change'}`,
          `\n   Queue   : ${queue.length} pending`,
          `\n─────────────────────────────────────────────────────\n`,
        );
      }

      if (wasOffline && isOnline) {
        connectivityCallback?.();
        if (queue.length > 0) {
          drainQueue();
        } else if (__DEV__) {
          console.log('🌐 [Network] Back online — queue is empty, nothing to drain.');
        }
      }
    });
  },

  /** Stop watching (cleanup on unmount) */
  stopWatching: () => {
    networkSub?.remove();
    networkSub  = null;
    isWatching  = false;
  },

  /** Current connectivity state */
  isOnline: () => isOnline,
};

// ── Queue drain ───────────────────────────────────────────────────────────────

async function drainQueue(): Promise<void> {
  if (!retryCallback) {
    if (__DEV__) console.warn('⚠️  [RetryQueue] drainQueue called but retryCallback is null — did you call setRetryCallback?');
    return;
  }
  if (queue.length === 0) {
    if (__DEV__) console.log('🔄 [RetryQueue] drainQueue called but queue is empty.');
    return;
  }

  const pending = queue.splice(0, queue.length); // take all, clear queue atomically

  // ── Deduplicate by method + url ───────────────────────────────────────────
  const seen = new Map<string, QueuedRequest>();
  const duplicates: Array<{ key: string; entry: QueuedRequest }> = [];

  for (const entry of pending) {
    const key = `${entry.config.method?.toUpperCase()}:${entry.config.url}`;
    if (seen.has(key)) {
      duplicates.push({ key, entry });
    } else {
      seen.set(key, entry);
    }
  }

  const unique = Array.from(seen.values());

  if (__DEV__) {
    console.log(
      `\n🔄 [RetryQueue] ─────────────────────────────────────`,
      `\n   Action   : DRAIN START`,
      `\n   Total    : ${pending.length} queued`,
      `\n   Unique   : ${unique.length} will execute`,
      `\n   Merged   : ${duplicates.length} duplicates (same result, no extra request)`,
      `\n   Requests :`,
      ...unique.map((u, i) =>
        `\n     ${i + 1}. ${u.config.method?.toUpperCase()} ${u.config.url}`
      ),
      duplicates.length > 0
        ? `\n   Duplicates:` + duplicates.map((d) => `\n     • ${d.key}`).join('')
        : '',
      `\n─────────────────────────────────────────────────────\n`,
    );
  }

  let successCount = 0;
  let failCount    = 0;

  await Promise.allSettled(
    unique.map(async ({ config, resolve, reject }) => {
      const key   = `${config.method?.toUpperCase()}:${config.url}`;
      const dupes = duplicates.filter((d) => d.key === key).map((d) => d.entry);

      if (__DEV__) {
        console.log(`   ⏳ [RetryQueue] Retrying: ${key}${dupes.length > 0 ? ` (+${dupes.length} merged)` : ''}`);
      }

      try {
        const result = await retryCallback!(config);
        resolve(result);
        dupes.forEach((d) => d.resolve(result));
        successCount++;
        if (__DEV__) console.log(`   ✅ [RetryQueue] Success : ${key}`);
      } catch (err: any) {
        reject(err);
        dupes.forEach((d) => d.reject(err));
        failCount++;
        if (__DEV__) console.warn(`   ❌ [RetryQueue] Failed  : ${key} — ${err?.message ?? err}`);
      }
    }),
  );

  if (__DEV__) {
    console.log(
      `\n🔄 [RetryQueue] ─────────────────────────────────────`,
      `\n   Action   : DRAIN COMPLETE`,
      `\n   Success  : ${successCount}`,
      `\n   Failed   : ${failCount}`,
      `\n   Remaining: ${queue.length} (new requests queued during drain)`,
      `\n─────────────────────────────────────────────────────\n`,
    );
  }

  if (successCount > 0) {
    retrySuccessListeners.forEach((fn) => fn(successCount));
  }

  // If new requests were queued during the drain (e.g. from retry callbacks),
  // drain again immediately.
  if (queue.length > 0 && isOnline) {
    if (__DEV__) console.log('🔄 [RetryQueue] New items queued during drain — draining again…');
    drainQueue();
  }
}
