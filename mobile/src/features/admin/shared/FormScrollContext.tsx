import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Keyboard, ScrollView } from 'react-native';

// ── Form mode ─────────────────────────────────────────────────────────────────

/**
 * 'page'  — full-screen Modal. OS handles keyboard avoidance natively.
 *           scrollToField and scrollToFirstError are no-ops.
 * 'modal' — bottom sheet. Manual scroll needed to keep fields above keyboard.
 */
export type FormMode = 'page' | 'modal';

// ── Context value ─────────────────────────────────────────────────────────────

interface FormScrollContextValue {
  mode:               FormMode;
  registerFieldY:     (id: string, y: number) => void;
  scrollToField:      (id: string) => void;
  scrollToFirstError: (ids: string[]) => void;
}

const FormScrollContext = createContext<FormScrollContextValue>({
  mode:               'page',
  registerFieldY:     () => {},
  scrollToField:      () => {},
  scrollToFirstError: () => {},
});

export const useFormScroll = (): FormScrollContextValue =>
  useContext(FormScrollContext);

// ── Provider ──────────────────────────────────────────────────────────────────

interface Props {
  scrollRef: React.RefObject<ScrollView | null>;
  mode:      FormMode;
  children:  React.ReactNode;
}

export const FormScrollProvider: React.FC<Props> = ({ scrollRef, mode, children }) => {
  const positions    = useRef<Map<string, number>>(new Map());
  const pendingField = useRef<string | null>(null);

  // In page mode the OS handles keyboard — no scroll listener needed
  useEffect(() => {
    if (mode !== 'modal') return;

    const sub = Keyboard.addListener('keyboardDidShow', () => {
      const id = pendingField.current;
      if (!id) return;
      pendingField.current = null;
      const y = positions.current.get(id);
      if (y === undefined || !scrollRef.current) return;
      scrollRef.current.scrollTo({ y: Math.max(0, y - 24), animated: true });
    });

    return () => sub.remove();
  }, [mode, scrollRef]);

  const registerFieldY = useCallback((id: string, y: number) => {
    positions.current.set(id, y);
  }, []);

  const scrollToField = useCallback((id: string) => {
    // No-op in page mode — OS handles it
    if (mode !== 'modal') return;

    pendingField.current = id;

    if (Keyboard.isVisible()) {
      pendingField.current = null;
      const y = positions.current.get(id);
      if (y === undefined || !scrollRef.current) return;
      scrollRef.current.scrollTo({ y: Math.max(0, y - 24), animated: true });
    }
  }, [mode, scrollRef]);

  const scrollToFirstError = useCallback((ids: string[]) => {
    // No-op in page mode — scroll to top of page is enough
    if (mode !== 'modal' || ids.length === 0) return;

    let minY    = Infinity;
    let targetY = 0;

    for (const id of ids) {
      const y = positions.current.get(id);
      if (y !== undefined && y < minY) {
        minY    = y;
        targetY = y;
      }
    }

    if (minY === Infinity || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, targetY - 24), animated: true });
  }, [mode, scrollRef]);

  const value = useMemo(
    () => ({ mode, registerFieldY, scrollToField, scrollToFirstError }),
    [mode, registerFieldY, scrollToField, scrollToFirstError],
  );

  return (
    <FormScrollContext.Provider value={value}>
      {children}
    </FormScrollContext.Provider>
  );
};
