/**
 * Lightweight event emitter for network errors.
 * The httpClient interceptor fires events here.
 * UI components subscribe to show dialogs/toasts.
 * No React dependency — safe to import from anywhere.
 */

type NetworkErrorListener = (message: string) => void;

const listeners = new Set<NetworkErrorListener>();

export const networkEvents = {
  onError: (fn: NetworkErrorListener) => {
    listeners.add(fn);
    return () => listeners.delete(fn); // returns unsubscribe
  },
  emit: (message: string) => {
    listeners.forEach((fn) => fn(message));
  },
};
