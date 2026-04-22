import { useRef, useEffect, useCallback } from 'react';
import { TextInput, InteractionManager, Platform } from 'react-native';

interface Options {
  /**
   * Delay in ms before attempting focus.
   * - iOS: 50ms is usually enough
   * - Android: 300ms needed to clear IME + layout pass
   * Default: platform-appropriate value
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
   * Useful for "focus only when creating, not editing".
   * Default: true
   */
  enabled?: boolean;
}

/**
 * useFocusInput — production-ready auto-focus for TextInput.
 *
 * Handles:
 *   - Timing issues (waits for native view mount + interactions to settle)
 *   - Modal animation delay
 *   - Android IME delay
 *   - Cleanup on unmount (prevents focus on unmounted component)
 *
 * Usage:
 *   const ref = useFocusInput();
 *   <TextInput ref={ref} ... />
 *
 *   // In a modal (add inModal: true):
 *   const ref = useFocusInput({ inModal: true });
 *
 *   // Only focus when creating (not editing):
 *   const ref = useFocusInput({ inModal: true, enabled: item === null });
 */
export function useFocusInput(options: Options = {}) {
  const {
    delay,
    inModal = false,
    enabled = true,
  } = options;

  const ref       = useRef<TextInput | null>(null);
  const mounted   = useRef(true);   // guards against focus after unmount
  const attempted = useRef(false);  // focus only once per mount

  // Compute delay: modal needs extra time for slide animation
  const resolvedDelay = delay ?? (
    inModal
      ? (Platform.OS === 'android' ? 400 : 300)
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

    return timer;
  }, [enabled, resolvedDelay]);

  useEffect(() => {
    mounted.current   = true;
    attempted.current = false;

    // InteractionManager.runAfterInteractions waits for:
    //   - Navigation transitions to complete
    //   - Modal animations to finish
    //   - Any pending JS interactions to settle
    // This is the correct hook — NOT setTimeout alone
    const interaction = InteractionManager.runAfterInteractions(() => {
      const timer = focus();
      return () => { if (timer) clearTimeout(timer); };
    });

    return () => {
      mounted.current = false;
      interaction.cancel();
    };
  }, [focus]);

  return ref;
}
