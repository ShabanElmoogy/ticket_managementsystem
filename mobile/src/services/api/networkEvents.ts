import * as Network from 'expo-network';
import type { AxiosRequestConfig } from 'axios';

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
type ApiErrorListener       = (status: number, message: string, details?: unknown) => void;
type RetrySuccessListener   = (count: number) => void;
type RetryCallback          = (config: AxiosRequestConfig) => Promise<unknown>;

interface QueuedRequest {
  config:   AxiosRequestConfig;
  resolve:  (value: unknown) => void;
  reject:   (reason: unknown) => void;
}

// ── State ─────────────────────────────────────────────────────────────────────

const errorListeners:        Set<NetworkErrorListener> = new Set();
const apiErrorListeners:     Set<ApiErrorListener>     = new Set();
const retrySuccessListeners: Set<RetrySuccessListener> = new Set();
const queue:                 QueuedRequest[]           = [];

let retryCallback:    RetryCallback | null = null;
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
  emitApiError: (status: number, message: string, details?: unknown) => {
    apiErrorListeners.forEach((fn) => fn(status, message, details));
  },

  // ── Retry queue ───────────────────────────────────────────────────────────

  /**
   * Register the retry callback — called by httpClient on init.
   * The callback receives an AxiosRequestConfig and re-executes it.
   */
  setRetryCallback: (cb: RetryCallback) => {
    retryCallback = cb;
  },

  /**
   * Enqueue a failed request for retry when connectivity is restored.
   * Returns a Promise that resolves/rejects when the retry completes.
   */
  enqueue: (config: AxiosRequestConfig): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      queue.push({ config, resolve, reject });
      if (__DEV__) {
        console.log(`📥 [RetryQueue] Queued: ${config.method?.toUpperCase()} ${config.url} (${queue.length} total)`);
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

  // ── Connectivity watcher ──────────────────────────────────────────────────

  /**
   * Start watching network connectivity.
   * Call once from the root layout on app start.
   */
  startWatching: () => {
    if (isWatching) return;
    isWatching = true;

    // Check current state immediately
    Network.getNetworkStateAsync().then((state) => {
      isOnline = !!(state.isConnected && state.isInternetReachable);
    });

    // Watch for changes
    networkSub = Network.addNetworkStateListener((state) => {
      const wasOffline = !isOnline;
      isOnline = !!(state.isConnected && state.isInternetReachable);

      if (__DEV__) {
        console.log(`🌐 Network: ${isOnline ? 'online' : 'offline'}`);
      }

      // Came back online — drain the queue
      if (wasOffline && isOnline && queue.length > 0) {
        drainQueue();
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
  if (!retryCallback || queue.length === 0) return;

  const pending = queue.splice(0, queue.length); // take all, clear queue
  if (__DEV__) {
    console.log(`🔄 [RetryQueue] Draining ${pending.length} queued request(s)…`);
  }

  let successCount = 0;

  await Promise.allSettled(
    pending.map(async ({ config, resolve, reject }) => {
      try {
        const result = await retryCallback!(config);
        resolve(result);
        successCount++;
        if (__DEV__) {
          console.log(`✅ [RetryQueue] Retried: ${config.method?.toUpperCase()} ${config.url}`);
        }
      } catch (err) {
        reject(err);
        if (__DEV__) {
          console.warn(`❌ [RetryQueue] Retry failed: ${config.method?.toUpperCase()} ${config.url}`, err);
        }
      }
    }),
  );

  if (successCount > 0) {
    retrySuccessListeners.forEach((fn) => fn(successCount));
  }
}
