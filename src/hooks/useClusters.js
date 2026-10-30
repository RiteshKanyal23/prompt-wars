import { useCallback, useEffect, useState } from 'react';
import { reportsRepository } from '@/services';

const DATA_CHANGED_EVENT = 'civicpulse:data-changed';

export function useClusters() {
  const [state, setState] = useState({ clusters: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const clusters = await reportsRepository.listClusters();
      setState({ clusters, loading: false, error: null });
    } catch (error) {
      setState({ clusters: [], loading: false, error });
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

  return { ...state, reload: load };
}
