import React, { useEffect } from 'react';
import { useDocsStore } from './hooks/useDocsStore';
import DocsBuilder from './DocsBuilder';

const DocsManagement: React.FC = () => {
  const loadAll = useDocsStore((s) => s.loadAll);

  useEffect(() => { void loadAll(); }, [loadAll]);

  return <DocsBuilder />;
};

export default DocsManagement;
