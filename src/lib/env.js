const rawMode = (import.meta.env.VITE_DATA_MODE || 'auto').trim().toLowerCase();
const requestedMode = ['auto', 'local', 'supabase'].includes(rawMode) ? rawMode : 'auto';
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const hasSupabase = Boolean(url && anonKey);

export const DATA_MODE =
  requestedMode === 'supabase' && !hasSupabase
    ? 'local'
    : requestedMode === 'auto'
      ? hasSupabase
        ? 'supabase'
        : 'local'
      : requestedMode;

export const IS_LOCAL_MODE = DATA_MODE === 'local';
export const SUPABASE_CONFIGURED = hasSupabase;
export const DEMO_CENTER = {
  lat: Number(import.meta.env.VITE_DEMO_CENTER_LAT || 12.9716),
  lng: Number(import.meta.env.VITE_DEMO_CENTER_LNG || 77.5946),
  label: import.meta.env.VITE_DEMO_CITY_LABEL || 'Sector 12, Demo City',
};
export const LLM_ENABLED = import.meta.env.VITE_AI_LLM_ENABLED === 'true';
export const AI_PROXY_URL = (import.meta.env.VITE_AI_PROXY_URL || '').trim();
