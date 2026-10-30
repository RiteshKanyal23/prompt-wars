import { useCallback, useEffect, useState } from 'react';
import { reportsRepository } from '@/services';

const DATA_CHANGED_EVENT = 'civicpulse:data-changed';

/**
 * Duplicate proposals live in their own repository collection because they are
 * review tasks, not report fields. The admin console is the only consumer.
 */
export function useDuplicatePairs() {
  const [state, setState] = useState({ pairs: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const pairs = await reportsRepository.listDuplicatePairs();
      setState({ pairs, loading: false, error: null });
    } catch (error) {
      setState({ pairs: [], loading: false, error });
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

  const review = useCallback(async (pairId, decision, reason = '') => {
    const pair = await reportsRepository.reviewDuplicate(pairId, decision, reason);
    return pair;
  }, []);

  return { ...state, reload: load, review };
}
