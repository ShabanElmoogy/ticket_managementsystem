/**
 * FormFocusContext — tracks field refs + Y positions for scroll-to-error.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. AppFormField calls registerRef(name, inputRef) on mount
 *   2. AppFormField calls registerY(name, y) via onLayout
 *   3. On submit error, AppForm calls focusFirst(errorFieldNames, scrollRef)
 *   4. focusFirst finds the topmost error field, scrolls to it, then focuses it
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   AppForm       — provides FormFocusProvider, calls focusFirst on submit error
 *   AppFormField  — registers field ref + Y position
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

interface FieldEntry {
  ref?: React.RefObject<any>;
  y:    number;
}

interface FormFocusContextValue {
  /** Register a field's inputRef so focusFirst can focus it */
  registerRef: (name: string, ref: React.RefObject<any>) => void;
  /** Register a field's Y position so focusFirst can scroll to it */
  registerY:   (name: string, y: number) => void;
  /** Scroll to + focus the topmost field in the names array */
  focusFirst:  (names: string[], scrollRef: React.RefObject<any>) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const FormFocusContext = createContext<FormFocusContextValue>({
  registerRef: () => {},
  registerY:   () => {},
  focusFirst:  () => {},
});

export const useFormFocus = () => useContext(FormFocusContext);

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

  const focusFirst = useCallback((names: string[], scrollRef: React.RefObject<any>) => {
    if (names.length === 0) return;

    // Find the topmost field (smallest Y)
    let minY       = Infinity;
    let targetName = names[0];

    for (const name of names) {
      const entry = fields.current.get(name);
      if (entry && entry.y < minY) {
        minY       = entry.y;
        targetName = name;
      }
    }

    const target = fields.current.get(targetName);
    if (!target) return;

    // Scroll to field
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, target.y - 24), animated: true });
    }

    // Focus after scroll settles
    setTimeout(() => {
      target.ref?.current?.focus?.();
    }, 250);
  }, []);

  return (
    <FormFocusContext.Provider value={{ registerRef, registerY, focusFirst }}>
      {children}
    </FormFocusContext.Provider>
  );
};
