import { useState, useEffect, useCallback } from 'react';
import { programmingApi } from '../api/programming';
import type { ProgrammingDetails } from '../../../services/api/types';

export function useProgrammingDetails(ticketId: string) {
  const [details, setDetails] = useState<ProgrammingDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    setFetching(true);
    programmingApi.get(ticketId)
      .then(data => setDetails(data))
      .catch(() => setDetails(null))
      .finally(() => setFetching(false));
  }, [ticketId]);

  const save = useCallback(async (patch: Partial<ProgrammingDetails>) => {
    setLoading(true);
    try {
      const data = await programmingApi.upsert(ticketId, patch);
      setDetails(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  return { details, save, loading, fetching };
}
