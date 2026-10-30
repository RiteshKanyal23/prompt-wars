import { describe, expect, it } from 'vitest';
import { assertTransition, canTransition } from '@/lib/workflow';

describe('workflow guard', () => {
  it('allows every documented forward move', () => {
    expect(canTransition('submitted', 'triaged')).toBe(true);
    expect(canTransition('triaged', 'assigned')).toBe(true);
    expect(canTransition('assigned', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'resolved')).toBe(true);
    expect(canTransition('resolved', 'closed')).toBe(true);
    expect(canTransition('triaged', 'duplicate')).toBe(true);
  });

  it('rejects backward and terminal moves', () => {
    expect(canTransition('resolved', 'assigned')).toBe(false);
    expect(canTransition('assigned', 'submitted')).toBe(false);
    expect(canTransition('closed', 'in_progress')).toBe(false);
    expect(canTransition('duplicate', 'triaged')).toBe(false);
    expect(canTransition('rejected', 'assigned')).toBe(false);
  });

  it('treats a no-op as allowed and unknown statuses as blocked', () => {
    expect(canTransition('assigned', 'assigned')).toBe(true);
    expect(canTransition('unknown', 'assigned')).toBe(false);
    expect(canTransition(null, 'assigned')).toBe(false);
  });

  it('throws a tagged error on an invalid move', () => {
    expect(() => assertTransition('resolved', 'assigned')).toThrow(/Invalid status transition/);
    try {
      assertTransition('resolved', 'assigned');
    } catch (error) {
      expect(error.code).toBe('INVALID_TRANSITION');
    }
  });
});
