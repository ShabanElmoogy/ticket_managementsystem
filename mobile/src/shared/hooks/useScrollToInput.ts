import { useRef, useCallback } from 'react';
import { ScrollView, type NativeSyntheticEvent, type TextInputFocusEventData } from 'react-native';

/**
 * useScrollToInput — scrolls a ScrollView to keep the focused TextInput
 * visible above the keyboard.
 *
 * Usage:
 *   const { scrollRef, onInputFocus } = useScrollToInput();
 *
 *   <ScrollView ref={scrollRef}>
 *     <TextInput onFocus={onInputFocus} />
 *     <TextInput onFocus={onInputFocus} />
 *   </ScrollView>
 */
export function useScrollToInput() {
  const scrollRef = useRef<ScrollView>(null);

  const onInputFocus = useCallback((
    e: NativeSyntheticEvent<TextInputFocusEventData>,
  ) => {
    const node = e.target;
    if (!node || !scrollRef.current) return;

    // Wait for keyboard to start appearing so the reduced height is known
    setTimeout(() => {
      if (!scrollRef.current) return;

      (node as any).measureLayout(
        (scrollRef.current as any)?.getScrollableNode?.() ?? scrollRef.current,
        (_x: number, y: number) => {
          // Scroll so the field sits 24px below the top of the visible area
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
        },
        () => {
          // Fallback: scroll to end
          scrollRef.current?.scrollToEnd({ animated: true });
        },
      );
    }, 150);
  }, []);

  return { scrollRef, onInputFocus };
}
