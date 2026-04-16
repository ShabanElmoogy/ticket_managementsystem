import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useDocsStore } from './hooks/useDocsStore';
import DocsBuilder from './DocsBuilder';

const DocsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    useDocsStore.getState().loadAll()
      .then(() => { if (!cancelled) setLoading(false); })
      .catch((err) => {
        console.error('[DocsManagement] loadAll failed:', err);
        if (!cancelled) { setLoading(false); setError('Failed to load documents. Please try again.'); }
      });

    return () => { cancelled = true; };
  }, []); // run once on mount — use getState() to avoid stale ref

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">Loading documents…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Typography variant="body2" color="error">{error}</Typography>
      </Box>
    );
  }

  return <DocsBuilder />;
};

export default DocsManagement;
