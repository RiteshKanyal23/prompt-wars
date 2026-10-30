import { useCallback, useState } from 'react';
import { reportsRepository } from '@/services';

/**
 * Operator mutations. The repository emits `civicpulse:data-changed`, so every
 * mounted hook refreshes; this hook only tracks the in-flight state and error.
 */
export function useUpdateReport() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateReport = useCallback(async (id, patch, event = null) => {
    setSaving(true);
    setError(null);
    try {
      return await reportsRepository.updateReport(id, patch, event);
    } catch (cause) {
      setError(cause);
      throw cause;
    } finally {
      setSaving(false);
    }
  }, []);

  return { updateReport, saving, error };
}
