import Toast from 'react-native-toast-message';

/**
 * toast — typed helpers for showing success, error, and info toasts.
 *
 * Not a hook — can be called anywhere (components, event handlers, services).
 *
 * @example
 *   import { toast } from '@/src/shared/hooks/useToast';
 *   toast.success('Saved!');
 *   toast.error('Something went wrong');
 *   toast.info('No changes to save');
 *
 *   // With title + body:
 *   toast.success('Customer created', 'John Doe was added successfully');
 */

// Visibility durations
const SUCCESS_DURATION_MS = 3000;
const ERROR_DURATION_MS   = 4000;
const INFO_DURATION_MS    = 3000;

function show(
  type:    'success' | 'error' | 'info',
  message: string,
  title?:  string,
  duration?: number,
) {
  Toast.show({
    type,
    // When title is provided: text1 = title (bold), text2 = message (body)
    // When no title:          text1 = message (only line shown)
    text1:          title ?? message,
    text2:          title ? message : undefined,
    visibilityTime: duration,
    position:       'bottom',
  });
}

export const toast = {
  success: (message: string, title?: string) =>
    show('success', message, title, SUCCESS_DURATION_MS),

  error: (message: string, title?: string) =>
    show('error', message, title, ERROR_DURATION_MS),

  info: (message: string, title?: string) =>
    show('info', message, title, INFO_DURATION_MS),

  hide: () => Toast.hide(),
};

/**
 * useToast — returns the toast object.
 * Kept for backward compatibility with components that call useToast().
 * Prefer importing `toast` directly.
 */
export function useToast() {
  return toast;
}
