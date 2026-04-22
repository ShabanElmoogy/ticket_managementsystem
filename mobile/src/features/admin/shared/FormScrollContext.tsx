import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { Keyboard, ScrollView } from 'react-native';

interface FormScrollContextValue {
  /** Called by each field wrapper with its measured Y offset */
  registerFieldY: (id: string, y: number) => void;
  /** Called by each field when it receives focus — scrolls after keyboard is shown */
  scrollToField: (id: string) => void;
  /** Scrolls to the field with the smallest Y among the given IDs */
  scrollToFirstError: (ids: string[]) => void;
}

const FormScrollContext = createContext<FormScrollContextValue>({
  registerFieldY:     () => {},
  scrollToField:      () => {},
  scrollToFirstError: () => {},
});

export const useFormScroll = (): FormScrollContextValue =>
  useContext(FormScrollContext);

interface Props {
  scrollRef: React.RefObject<ScrollView>;
  children: React.ReactNode;
}

/**
 * FormScrollProvider — wraps the ScrollView content.
 *
 * Fields register their Y position on layout, then call scrollToField on focus.
 * Scrolling is deferred until the keyboard is fully shown (keyboardDidShow event)
 * instead of using a fixed setTimeout — avoids premature scroll before the
 * keyboard has finished animating.
 *
 * No children manipulation, no key changes, no re-renders.
 */
export const FormScrollProvider: React.FC<Props> = ({ scrollRef, children }) => {
  const positions    = useRef<Map<string, number>>(new Map());
  const pendingField = useRef<string | null>(null);

  // When the keyboard finishes showing, flush any pending scroll
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      const id = pendingField.current;
      if (!id) return;
      pendingField.current = null;

      const y = positions.current.get(id);
      if (y === undefined || !scrollRef.current) return;
      scrollRef.current.scrollTo({ y: Math.max(0, y - 24), animated: true });
    });

    return () => sub.remove();
  }, [scrollRef]);

  const registerFieldY = useCallback((id: string, y: number) => {
    positions.current.set(id, y);
  }, []);

  const scrollToField = useCallback((id: string) => {
    // Queue the field; the keyboardDidShow listener will execute the scroll
    pendingField.current = id;

    // If the keyboard is already visible (switching between fields),
    // keyboardDidShow won't fire again — scroll immediately
    if (Keyboard.isVisible()) {
      pendingField.current = null;
      const y = positions.current.get(id);
      if (y === undefined || !scrollRef.current) return;
      scrollRef.current.scrollTo({ y: Math.max(0, y - 24), animated: true });
    }
  }, [scrollRef]);

  const scrollToFirstError = useCallback((ids: string[]) => {
    if (ids.length === 0) return;

    let minY     = Infinity;
    let targetY  = 0;

    for (const id of ids) {
      const y = positions.current.get(id);
      if (y !== undefined && y < minY) {
        minY    = y;
        targetY = y;
      }
    }

    if (minY === Infinity || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, targetY - 24), animated: true });
  }, [scrollRef]);

  return (
    <FormScrollContext.Provider value={{ registerFieldY, scrollToField, scrollToFirstError }}>
      {children}
    </FormScrollContext.Provider>
  );
};
