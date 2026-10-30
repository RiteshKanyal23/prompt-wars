import { useCallback, useEffect, useState } from 'react';
import { reportsRepository } from '@/services';

const DATA_CHANGED_EVENT = 'civicpulse:data-changed';

/**
 * Loads one report plus its events.
 *
 * @param {string} identifier  report id, or a tracking code when `byCode` is true
 */
export function useReport(identifier, { byCode = false, publicOnly = false } = {}) {
  const [state, setState] = useState({
    report: null,
    events: [],
    loading: Boolean(identifier),
    error: null,
  });

  const load = useCallback(async () => {
    if (!identifier) {
      setState({ report: null, events: [], loading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const report = byCode
        ? await reportsRepository.getReportByCode(identifier)
        : await reportsRepository.getReportById(identifier);
      const events = report
        ? await reportsRepository.listEvents(report.id, { publicOnly })
        : [];
      setState({ report, events, loading: false, error: null });
    } catch (error) {
      setState({ report: null, events: [], loading: false, error });
    }
  }, [identifier, byCode, publicOnly]);

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
