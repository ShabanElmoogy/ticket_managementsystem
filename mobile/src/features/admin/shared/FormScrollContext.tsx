import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Keyboard } from 'react-native';

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
  /** Scroll + focus first empty required field. Returns true if any found. */
  scrollToFirstError: (ids?: string[]) => boolean;
  /** Returns false and scrolls/focuses/marks error if a required field above is empty */
  canFocusField:      (id: string) => boolean;
  /** Mark a specific field as having an error (scroll + focus + inline error) */
  markFieldError:     (id: string) => void;
  /** Validate a single field — returns true if valid, false + marks error if invalid */
  validateField:      (id: string) => boolean;
  /** Field id that currently has an inline error shown */
  errorFieldId:       string | null;
  clearError:         () => void;
}

const FormScrollContext = createContext<FormScrollContextValue>({
  mode:               'page',
  registerField:      () => {},
  registerFieldY:     () => {},
  registerFieldRef:   () => {},
  scrollToField:      () => {},
  scrollToFirstError: () => false,
  canFocusField:      () => true,
  markFieldError:     () => {},
  validateField:      () => true,
  errorFieldId:       null,
  clearError:         () => {},
});

export const useFormScroll = (): FormScrollContextValue =>
  useContext(FormScrollContext);

interface Props {
  scrollRef:  React.RefObject<any>;
  mode:       FormMode;
  children?:  React.ReactNode;
}

export const FormScrollProvider: React.FC<Props> = ({ scrollRef, mode, children }) => {
  const fields       = useRef<Map<string, FieldMeta>>(new Map());
  const pendingField = useRef<string | null>(null);
  const [errorFieldId, setErrorFieldId] = useState<string | null>(null);

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

  const registerFieldY = useCallback((id: string, y: number) => {
    registerField(id, { y });
  }, [registerField]);

  const registerFieldRef = useCallback((id: string, ref: React.RefObject<any>) => {
    registerField(id, { ref });
  }, [registerField]);

  const clearError = useCallback(() => setErrorFieldId(null), []);

  // ── Shared: scroll + focus + mark error on a field ─────────────────────────

  const markFieldError = useCallback((id: string) => {
    const meta = fields.current.get(id);
    if (!meta) return;

    setErrorFieldId(id);

    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, meta.y - 24), animated: true });
    }
    setTimeout(() => {
      meta.ref?.current?.focus();
      meta.ref?.current?.setNativeProps?.({ selection: { start: 0, end: 0 } });
    }, 200);
  }, [scrollRef]);

  // ── Validate a single field ─────────────────────────────────────────────────

  const validateField = useCallback((id: string): boolean => {
    const meta = fields.current.get(id);
    if (!meta) return true;
    if (!meta.required) return true;
    const isEmpty = String(meta.getValue?.() ?? '').trim().length === 0;
    if (isEmpty) {
      markFieldError(id);
      return false;
    }
    return true;
  }, [markFieldError]);

  const canFocusField = useCallback((targetId: string): boolean => {
    const target = fields.current.get(targetId);
    if (!target) return true;

    const blockers: { id: string; meta: FieldMeta }[] = [];
    for (const [id, meta] of fields.current.entries()) {
      if (id === targetId) continue;
      if (!meta.required) continue;
      if (meta.y >= target.y) continue;
      if (String(meta.getValue?.() ?? '').trim().length > 0) continue;
      blockers.push({ id, meta });
    }

    if (blockers.length === 0) return true;

    // Find topmost blocker
    const first = blockers.reduce((a, b) => a.meta.y < b.meta.y ? a : b);
    markFieldError(first.id);
    return false;
  }, [markFieldError]);

  // ── Scroll to first empty required field ────────────────────────────────────

  const scrollToFirstError = useCallback((ids?: string[]): boolean => {
    let errorIds: string[] = ids ?? [];

    if (!ids) {
      for (const [id, meta] of fields.current.entries()) {
        if (meta.required && String(meta.getValue?.() ?? '').trim().length === 0) {
          errorIds.push(id);
        }
      }
    }

    if (errorIds.length === 0) return false;

    // Find topmost
    let minY     = Infinity;
    let targetId = errorIds[0];

    for (const id of errorIds) {
      const meta = fields.current.get(id);
      if (meta && meta.y < minY) { minY = meta.y; targetId = id; }
    }

    markFieldError(targetId);
    return true;
  }, [markFieldError]);

  // ── Scroll to field (modal keyboard) ────────────────────────────────────────

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

  const value = useMemo(
    () => ({ mode, registerField, registerFieldY, registerFieldRef, scrollToField, scrollToFirstError, canFocusField, markFieldError, validateField, errorFieldId, clearError }),
    [mode, registerField, registerFieldY, registerFieldRef, scrollToField, scrollToFirstError, canFocusField, markFieldError, validateField, errorFieldId, clearError],
  );

  return (
    <FormScrollContext.Provider value={value}>
      {children}
    </FormScrollContext.Provider>
  );
};
