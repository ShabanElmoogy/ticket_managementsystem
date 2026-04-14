import React, { createContext, useContext } from 'react';
import type { useDocsBuilder } from './useDocsBuilder';

export type DocsBuilderState = ReturnType<typeof useDocsBuilder>;

const DocsContext = createContext<DocsBuilderState | null>(null);

export const DocsProvider: React.FC<{ value: DocsBuilderState; children: React.ReactNode }> = ({
  value,
  children,
}) => <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;

export function useDocsContext(): DocsBuilderState {
  const ctx = useContext(DocsContext);
  if (!ctx) throw new Error('useDocsContext must be used inside <DocsProvider>');
  return ctx;
}
