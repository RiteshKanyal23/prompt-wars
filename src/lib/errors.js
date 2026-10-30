/**
 * Maps low-level errors to copy a citizen can act on. Raw Supabase errors and
 * stack traces must never reach the UI.
 */
export function toUserMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';

  const rawCode = error.code ?? error.status;
  const code = rawCode === undefined || rawCode === null ? '' : String(rawCode);
  const message = String(error.message ?? '');

  if (code === '23505') return 'That tracking code was already used. Please retry.';
  if (code === 'INVALID_TRANSITION') {
    return 'That status change is not allowed from the current stage. Refresh and try again.';
  }
  if (code === '42501' || /row-level security|permission denied/i.test(message)) {
    return 'You do not have permission for this action.';
  }
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return 'Could not reach the server. Your report is still in the form.';
  }
  if (/not found/i.test(message)) return 'We could not find that record.';

  return message || 'Something went wrong. Please try again.';
}
