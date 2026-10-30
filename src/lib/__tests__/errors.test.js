import { describe, expect, it } from 'vitest';
import { toUserMessage } from '@/lib/errors';

describe('toUserMessage', () => {
  it('falls back to a generic message for empty input', () => {
    expect(toUserMessage(null)).toBe('Something went wrong. Please try again.');
    expect(toUserMessage({})).toBe('Something went wrong. Please try again.');
  });

  it('maps duplicate-key and transition errors to actionable copy', () => {
    expect(toUserMessage({ code: '23505' })).toBe(
      'That tracking code was already used. Please retry.',
    );
    expect(toUserMessage({ code: 'INVALID_TRANSITION' })).toBe(
      'That status change is not allowed from the current stage. Refresh and try again.',
    );
  });

  it('maps permission and network failures', () => {
    expect(toUserMessage({ code: '42501' })).toBe('You do not have permission for this action.');
    expect(toUserMessage({ message: 'row-level security policy violated' })).toBe(
      'You do not have permission for this action.',
    );
    expect(toUserMessage({ message: 'Failed to fetch' })).toBe(
      'Could not reach the server. Your report is still in the form.',
    );
  });

  it('maps not-found and preserves unknown messages', () => {
    expect(toUserMessage({ message: 'Report not found' })).toBe(
      'We could not find that record.',
    );
    expect(toUserMessage({ message: 'Disk quota exceeded' })).toBe('Disk quota exceeded');
  });

  it('accepts a numeric status as the error code', () => {
    expect(toUserMessage({ status: 42501 })).toBe('You do not have permission for this action.');
  });
});
