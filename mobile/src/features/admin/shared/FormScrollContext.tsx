import React, { createContext, useContext, useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';

interface FormScrollContextValue {
  /** Called by each field wrapper with its measured Y offset */
  registerFieldY: (id: string, y: number) => void;
  /** Called by each field when it receives focus */
  scrollToField: (id: string) => void;
}

const FormScrollContext = createContext<FormScrollContextValue>({
  registerFieldY: () => {},
  scrollToField:  () => {},
});

export const useFormScroll = () => useContext(FormScrollContext);

interface Props {
  scrollRef: React.RefObject<ScrollView>;
  children: React.ReactNode;
}

/**
 * FormScrollProvider — wraps the ScrollView content.
 * Fields register their Y position on layout, then call scrollToField on focus.
 * No children manipulation, no key changes, no re-renders.
 */
export const FormScrollProvider: React.FC<Props> = ({ scrollRef, children }) => {
  const positions = useRef<Map<string, number>>(new Map());

  const registerFieldY = useCallback((id: string, y: number) => {
    positions.current.set(id, y);
  }, []);

  const scrollToField = useCallback((id: string) => {
    const y = positions.current.get(id);
    if (y === undefined || !scrollRef.current) return;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
    }, 150);
  }, [scrollRef]);

  return (
    <FormScrollContext.Provider value={{ registerFieldY, scrollToField }}>
      {children}
    </FormScrollContext.Provider>
  );
};
