/**
 * FormFocusContext — tracks field refs + Y positions for scroll-to-error.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. AppFormField calls registerRef(name, inputRef) on mount
 *      and unregisterField(name) on unmount
 *   2. AppFormField calls registerY(name, y) via onLayout
 *   3. On submit error, AppForm calls focusFirst(errorFieldNames, scrollRef)
 *   4. focusFirst finds the topmost error field, scrolls to it, then focuses it
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   AppForm       — provides FormFocusProvider, calls focusFirst on submit error
 *   AppFormField  — registers/unregisters field ref + Y position
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   // Wrap form content
 *   <FormFocusProvider>
 *     <AppFormField name="email" control={control}>
 *       <AppTextInput inputRef={emailRef} ... />
 *     </AppFormField>
 *   </FormFocusProvider>
 *
 *   // Trigger scroll-to-error
 *   const { focusFirst } = useFormFocus();
 *   focusFirst(['email', 'name'], scrollRef);
 */

import React, { createContext, useContext, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Focusable {
  focus(): void;
}

interface ScrollTarget {
  scrollTo(options: { y: number; animated: boolean }): void;
}

interface FieldEntry {
  ref?: React.RefObject<any>;
  y:    number;
}

interface FormFocusContextValue {
  /** Register a field's inputRef so focusFirst can focus it */
  registerRef:     (name: string, ref: React.RefObject<any>) => void;
  /** Register a field's Y position so focusFirst can scroll to it */
  registerY:       (name: string, y: number) => void;
  /** Remove a field's entry — call on unmount for conditional fields */
  unregisterField: (name: string) => void;
  /** Scroll to + focus the topmost field in the names array */
  focusFirst:      (names: string[], scrollRef: React.RefObject<ScrollTarget>) => void;
}

// Delay after scrollTo before focusing — allows scroll animation to settle
const FOCUS_AFTER_SCROLL_MS = 250;

// ── Context ───────────────────────────────────────────────────────────────────

const FormFocusContext = createContext<FormFocusContextValue | null>(null);

/**
 * useFormFocus — must be called inside a FormFocusProvider.
 * Throws in development if used outside the provider.
 */
export function useFormFocus(): FormFocusContextValue {
  const ctx = useContext(FormFocusContext);
  if (!ctx) {
    if (__DEV__) {
      throw new Error('useFormFocus must be used inside a <FormFocusProvider>');
    }
    // Production fallback — no-ops to avoid crashing
    return {
      registerRef:     () => {},
      registerY:       () => {},
      unregisterField: () => {},
      focusFirst:      () => {},
    };
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const FormFocusProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const fields = useRef<Map<string, FieldEntry>>(new Map());

  const registerRef = useCallback((name: string, ref: React.RefObject<any>) => {
    const existing = fields.current.get(name) ?? { y: 0 };
    fields.current.set(name, { ...existing, ref });
  }, []);

  const registerY = useCallback((name: string, y: number) => {
    const existing = fields.current.get(name) ?? { y: 0 };
    fields.current.set(name, { ...existing, y });
  }, []);

  const unregisterField = useCallback((name: string) => {
    fields.current.delete(name);
  }, []);

  const focusFirst = useCallback((
    names: string[],
    scrollRef: React.RefObject<ScrollTarget>,
  ) => {
    if (names.length === 0) return;

    // Find the topmost registered field (smallest Y) among the error fields
    let minY:       number          = Infinity;
    let targetName: string | null   = null;

    for (const name of names) {
      const entry = fields.current.get(name);
      if (entry && entry.y < minY) {
        minY       = entry.y;
        targetName = name;
      }
    }

    // No registered entry found for any of the error fields
    if (targetName === null) return;

    const target = fields.current.get(targetName);
    if (!target) return;

    // Scroll to field — offset by 24px so the label is visible above the input
    scrollRef.current?.scrollTo({ y: Math.max(0, target.y - 24), animated: true });

    // Focus after scroll animation settles
    setTimeout(() => {
      target.ref?.current?.focus?.();
    }, FOCUS_AFTER_SCROLL_MS);
  }, []);

  return (
    <FormFocusContext.Provider value={{ registerRef, registerY, unregisterField, focusFirst }}>
      {children}
    </FormFocusContext.Provider>
  );
};
