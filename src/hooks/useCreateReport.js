import { useCallback, useState } from 'react';
import { reportsRepository } from '@/services';

/**
 * Mutation hook for the capture flow.
 *
 * The page owns the form and its validation; this hook owns the write and the
 * local "recent codes" convenience so no component imports the repository.
 * It rethrows so the caller can keep the form values and show an error.
 */
export function useCreateReport() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const createReport = useCallback(async (input) => {
    setSubmitting(true);
    setError(null);

    try {
      const report = await reportsRepository.createReport(input);

      try {
        await reportsRepository.rememberCode(report.referenceCode);
      } catch {
        // The report is saved; a recent-code cache failure must not hide it.
      }

      return report;
    } catch (cause) {
      setError(cause);
      throw cause;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { createReport, submitting, error };
}
