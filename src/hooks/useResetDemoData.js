import { useCallback, useState } from 'react';
import { reportsRepository } from '@/services';

/** Restores the seeded dataset. Local mode only — the repository throws otherwise. */
export function useResetDemoData() {
  const [resetting, setResetting] = useState(false);

  const reset = useCallback(async () => {
    setResetting(true);
    try {
      await reportsRepository.reset();
    } finally {
      setResetting(false);
    }
  }, []);

  return { reset, resetting };
}
