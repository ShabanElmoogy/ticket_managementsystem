import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Alert, Keyboard, ScrollView } from 'react-native';

export type FormMode = 'page' | 'modal';

interface FieldMeta {
  y:        number;
  ref?:     React.RefObject<any>;
  required: boolean;
  getValue: () => string;
  label:    string;
}

interface FormScrollContextValue {
  mode:               FormMode;
  registerField:      (id: string, meta: Partial<FieldMeta>) => void;
  registerFieldY:     (id: string, y: number) => void;
  registerFieldRef:   (id: string, ref: React.RefObject<any>) => void;
  scrollToField:      (id: string) => void;
  scrollToFirstError: (ids: string[]) => void;
  /** Returns false and shows toast if a required field above this one is empty */
  canFocusField:      (id: string) => boolean;
}

const FormScrollContext = createContext<FormScrollContextValue>({
  mode:               'page',
  registerField:      () => {},
  registerFieldY:     () => {},
  registerFieldRef:   () => {},
  scrollToField:      () => {},
  scrollToFirstError: () => {},
  canFocusField:      () => true,
});

export const useFormScroll = (): FormScrollContextValue =>
  useContext(FormScrollContext);

interface Props {
  scrollRef: React.RefObject<any>;
  mode:      FormMode;
  children?: React.ReactNode;
}

export const FormScrollProvider: React.FC<Props> = ({ scrollRef, mode, children }) => {
  const fields       = useRef<Map<string, FieldMeta>>(new Map());
  const pendingField = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== 'modal') return;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      const id = pendingField.current;
      if (!id) return;
      pendingField.current = null;
      const meta = fields.current.get(id);
      if (!meta || !scrollRef.current) return;
      scrollRef.current.scrollTo({ y: Math.max(0, meta.y - 24), animated: true });
    });
    return () => sub.remove();
  }, [mode, scrollRef]);

  // ── Registration ────────────────────────────────────────────────────────────

  const registerField = useCallback((id: string, meta: Partial<FieldMeta>) => {
    const existing = fields.current.get(id) ?? { y: 0, required: false, getValue: () => '', label: '' };
    fields.current.set(id, { ...existing, ...meta });
  }, []);

  // Legacy helpers — delegate to registerField
  const registerFieldY = useCallback((id: string, y: number) => {
    registerField(id, { y });
  }, [registerField]);

  const registerFieldRef = useCallback((id: string, ref: React.RefObject<any>) => {
    registerField(id, { ref });
  }, [registerField]);

  // ── Focus guard ─────────────────────────────────────────────────────────────

  /**
   * Check if all required fields that appear ABOVE the target field (lower Y)
   * have values. If any are empty, scroll to the first empty one, focus it,
   * show a toast, and return false.
   */
  const canFocusField = useCallback((targetId: string): boolean => {
    const target = fields.current.get(targetId);
    if (!target) return true;

    // Collect required fields above this one (smaller Y) that are empty
    const blockers: { id: string; meta: FieldMeta }[] = [];

    for (const [id, meta] of fields.current.entries()) {
      if (id === targetId) continue;
      if (!meta.required) continue;
      if (meta.y >= target.y) continue;           // not above
      if (String(meta.getValue?.() ?? '').trim().length > 0) continue; // has value
      blockers.push({ id, meta });
    }

    if (blockers.length === 0) return true;

    // Find the topmost blocker
    const first = blockers.reduce((a, b) => a.meta.y < b.meta.y ? a : b);

    // Scroll to it
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, first.meta.y - 24), animated: true });
    }

    // Focus it + show alert dialog
    setTimeout(() => {
      first.meta.ref?.current?.focus();
      first.meta.ref?.current?.setNativeProps?.({ selection: { start: 9999, end: 9999 } });
    }, 200);

    const label = first.meta.label || 'This field';
    Alert.alert(
      'Required Field',
      `"${label}" must be filled before continuing.`,
      [{ text: 'OK', style: 'default' }],
      { cancelable: true },
    );

    return false;
  }, [scrollRef, toast]);

  // ── Scroll to field ─────────────────────────────────────────────────────────

  const scrollToField = useCallback((id: string) => {
    if (mode !== 'modal') return;
    pendingField.current = id;
    if (Keyboard.isVisible()) {
      pendingField.current = null;
      const meta = fields.current.get(id);
      if (!meta || !scrollRef.current) return;
      scrollRef.current.scrollTo({ y: Math.max(0, meta.y - 24), animated: true });
    }
  }, [mode, scrollRef]);

  // ── Scroll + focus first error ──────────────────────────────────────────────

  const scrollToFirstError = useCallback((ids: string[]) => {
    if (ids.length === 0) return;

    let minY     = Infinity;
    let targetId = ids[0];
    let targetY  = 0;

    for (const id of ids) {
      const meta = fields.current.get(id);
      if (meta && meta.y < minY) {
        minY     = meta.y;
        targetId = id;
        targetY  = meta.y;
      }
    }

    if (minY !== Infinity && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, targetY - 24), animated: true });
    }

    setTimeout(() => {
      const meta = fields.current.get(targetId);
      if (meta?.ref?.current) {
        meta.ref.current.focus();
        meta.ref.current.setNativeProps?.({ selection: { start: 9999, end: 9999 } });
      }
    }, 200);
  }, [scrollRef]);

  const value = useMemo(
    () => ({ mode, registerField, registerFieldY, registerFieldRef, scrollToField, scrollToFirstError, canFocusField }),
    [mode, registerField, registerFieldY, registerFieldRef, scrollToField, scrollToFirstError, canFocusField],
  );

  return (
    <FormScrollContext.Provider value={value}>
      {children}
    </FormScrollContext.Provider>
  );
};
