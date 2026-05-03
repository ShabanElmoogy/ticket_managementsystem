import { useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface Options {
  /**
   * Delay in ms before attempting focus.
   * Defaults to a platform-appropriate value:
   *   - iOS:     50ms  (layout pass is fast)
   *   - Android: 300ms (IME + layout pass needs more time)
   * Add inModal:true for an extra 250ms when inside a Modal.
   */
  delay?: number;

  /**
   * Set to true when the input is inside a Modal.
   * Adds extra delay for the modal slide animation to complete.
   * Default: false
   */
  inModal?: boolean;

  /**
   * Only focus when this condition is true.
   * Useful for "focus only when creating, not editing":
   *   useFocusInput({ enabled: item === null })
   * Default: true
   */
  enabled?: boolean;
}

interface Focusable {
  focus(): void;
}

/**
 * useFocusInput — auto-focus a TextInput after mount.
 *
 * Handles:
 *   - Platform timing differences (Android IME delay vs iOS)
 *   - Modal animation delay (inModal: true)
 *   - Cleanup on unmount (never focuses an unmounted component)
 *   - Single focus per mount (won't re-focus on re-renders)
 *
 * @example
 *   // Basic
 *   const ref = useFocusInput();
 *   <TextInput ref={ref} />
 *
 *   // Inside a Modal
 *   const ref = useFocusInput({ inModal: true });
 *
 *   // Only when creating (not editing)
 *   const ref = useFocusInput({ enabled: item === null });
 */
export function useFocusInput(options: Options = {}) {
  const { delay, inModal = false, enabled = true } = options;

  const ref       = useRef<Focusable | null>(null);
  const mounted   = useRef(true);
  const attempted = useRef(false);

  // Platform-appropriate delay, with extra time for modal slide animation
  const resolvedDelay = delay ?? (
    inModal
      ? (Platform.OS === 'android' ? 450 : 350)
      : (Platform.OS === 'android' ? 300 : 50)
  );

  const focus = useCallback(() => {
    if (!mounted.current || attempted.current || !enabled) return;
    attempted.current = true;

    const timer = setTimeout(() => {
      if (mounted.current && ref.current) {
        ref.current.focus();
      }
    }, resolvedDelay);

    return () => clearTimeout(timer);
  }, [enabled, resolvedDelay]);

  useEffect(() => {
    mounted.current   = true;
    attempted.current = false;

    const cleanup = focus();

    return () => {
      mounted.current = false;
      cleanup?.();
    };
  }, [focus]);

  return ref;
}
