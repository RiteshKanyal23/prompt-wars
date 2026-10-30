import { useCallback, useEffect, useRef, useState } from 'react';
import { reportsRepository } from '@/services';

const DATA_CHANGED_EVENT = 'civicpulse:data-changed';

export function useReports(filters = {}) {
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const key = JSON.stringify(filters);

  const [state, setState] = useState({ data: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await reportsRepository.listReports(filtersRef.current);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: [], loading: false, error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, key]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => load();
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [load]);

  return { ...state, reload: load };
}
