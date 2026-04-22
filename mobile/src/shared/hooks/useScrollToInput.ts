import { useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';

/**
 * useScrollToInput — scrolls a ScrollView to keep the focused TextInput
 * visible above the keyboard.
 *
 * Works on both old and new React Native architecture.
 *
 * Usage:
 *   const { scrollRef, handleInputFocus } = useScrollToInput();
 *
 *   <ScrollView ref={scrollRef}>
 *     {React.Children.map(children, child =>
 *       React.cloneElement(child, { onFocus: handleInputFocus })
 *     )}
 *   </ScrollView>
 *
 * Or use the helper to inject onFocus automatically (see AdminFormModal).
 */
export function useScrollToInput() {
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Map<any, { y: number }>>(new Map());

  /**
   * Call this from each input's onLayout to track its position.
   * The form modal injects this automatically.
   */
  const handleInputLayout = useCallback((key: any, y: number) => {
    inputRefs.current.set(key, { y });
  }, []);

  /**
   * Call this from each input's onFocus to scroll it into view.
   * The form modal injects this automatically.
   */
  const handleInputFocus = useCallback((key: any) => {
    const position = inputRefs.current.get(key);
    if (!position || !scrollRef.current) return;

    // Wait for keyboard to start appearing
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, position.y - 24),
        animated: true,
      });
    }, 150);
  }, []);

  return { scrollRef, handleInputLayout, handleInputFocus };
}
