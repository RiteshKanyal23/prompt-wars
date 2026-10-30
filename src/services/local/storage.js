/**
 * Thin, SSR-safe wrapper around `window.localStorage`.
 *
 * Only the repository may import this module. Components and hooks must go
 * through `@/services`, so the Supabase adapter can replace it without touching
 * the UI.
 */
export const STORAGE_PREFIX = 'civicpulse:v1';

export const STORAGE_KEYS = {
  reports: `${STORAGE_PREFIX}:reports`,
  events: `${STORAGE_PREFIX}:events`,
  duplicates: `${STORAGE_PREFIX}:duplicates`,
  meta: `${STORAGE_PREFIX}:meta`,
  recentCodes: `${STORAGE_PREFIX}:recent-codes`,
};

const DATA_CHANGED_EVENT = 'civicpulse:data-changed';

/** Returns localStorage when it is usable, otherwise null (SSR, privacy mode). */
export function getStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = `${STORAGE_PREFIX}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isStorageAvailable() {
  return getStorage() !== null;
}

export function readJson(key, fallback) {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  const storage = getStorage();
  if (!storage) {
    const error = new Error('Local storage is unavailable in this browser.');
    error.code = 'storage_unavailable';
    throw error;
  }
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (cause) {
    const error = new Error(
      'Could not save to local storage. The demo data may be too large for this browser.',
    );
    error.code = 'storage_write_failed';
    error.cause = cause;
    throw error;
  }
}

export function removeKey(key) {
  getStorage()?.removeItem(key);
}

export function clearStorage() {
  const storage = getStorage();
  if (!storage) return;
  Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
}

/** Tells open tabs and mounted hooks that the dataset changed. */
export function notifyDataChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
}

export { DATA_CHANGED_EVENT };
