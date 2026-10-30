import { DATA_MODE } from '@/lib/env';
import { localRepository } from '@/services/local/localRepository';
import { supabaseRepository } from '@/services/supabase/supabaseRepository';

/**
 * The only repository the UI is allowed to import. Both adapters implement the
 * same async interface (trd.md §9.3), so switching data mode never touches a
 * component or hook.
 */
export const reportsRepository =
  DATA_MODE === 'supabase' ? supabaseRepository : localRepository;
