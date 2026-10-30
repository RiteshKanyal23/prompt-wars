import { createClient } from '@supabase/supabase-js';
import { DATA_MODE } from '@/lib/env';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/** Never create a client in local mode; importing this module must not crash. */
export const supabase =
  DATA_MODE === 'supabase' && url && anonKey ? createClient(url, anonKey) : null;
