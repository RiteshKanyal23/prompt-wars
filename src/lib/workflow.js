import { ALLOWED_TRANSITIONS } from './constants';

/**
 * Single source of truth for status moves. Both the admin stepper and the
 * repositories call this so a direct repository call cannot bypass the guard.
 *
 * @param {string|null|undefined} from
 * @param {string|null|undefined} to
 */
export function canTransition(from, to) {
  if (!from || !to) return false;
  if (from === to) return true;
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Throws a tagged error when a caller attempts a status move that the state
 * machine does not allow. The UI maps `INVALID_TRANSITION` to human copy.
 *
 * @param {string|null|undefined} from
 * @param {string|null|undefined} to
 */
export function assertTransition(from, to) {
  if (canTransition(from, to)) return;
  const error = new Error(`Invalid status transition: ${from} → ${to}`);
  error.code = 'INVALID_TRANSITION';
  throw error;
}
