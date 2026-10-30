import { useCallback, useEffect, useState } from 'react';
import { reportsRepository } from '@/services';

const DATA_CHANGED_EVENT = 'civicpulse:data-changed';

/** Recent tracking codes are a local-demo convenience, never a source of truth. */
export function useRecentCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await reportsRepository.listRecentCodes();
      setCodes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => load();
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [load]);

  const clear = useCallback(async () => {
    await reportsRepository.clearRecentCodes();
    setCodes([]);
  }, []);

  return { codes, loading, reload: load, clear };
}
