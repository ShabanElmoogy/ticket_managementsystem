/**
 * FormFocusContext — tracks field refs + Y positions for scroll-to-error.
 * Used by AppFormField to register inputs, and by AppForm to scroll on submit error.
 */
import React, { createContext, useContext, useRef, useCallback } from 'react';

interface FieldEntry {
  ref?: React.RefObject<any>;
  y:    number;
}

interface FormFocusContextValue {
  registerRef: (name: string, ref: React.RefObject<any>) => void;
  registerY:   (name: string, y: number) => void;
  focusFirst:  (names: string[], scrollRef: React.RefObject<any>) => void;
}

const FormFocusContext = createContext<FormFocusContextValue>({
  registerRef: () => {},
  registerY:   () => {},
  focusFirst:  () => {},
});

export const useFormFocus = () => useContext(FormFocusContext);

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

    // Find the field with the smallest Y (topmost on screen)
    let minY     = Infinity;
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

    // Scroll to it
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, target.y - 24), animated: true });
    }

    // Focus after scroll animation
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
