import { describe, expect, it } from 'vitest';
import { nextTabKey } from '@/hooks/useTabList';

const KEYS = ['queue', 'duplicates', 'hotspots', 'reports'];

describe('nextTabKey', () => {
  it('moves right and wraps at the end', () => {
    expect(nextTabKey(KEYS, 'queue', 'ArrowRight')).toBe('duplicates');
    expect(nextTabKey(KEYS, 'reports', 'ArrowRight')).toBe('queue');
  });

  it('moves left and wraps at the start', () => {
    expect(nextTabKey(KEYS, 'duplicates', 'ArrowLeft')).toBe('queue');
    expect(nextTabKey(KEYS, 'queue', 'ArrowLeft')).toBe('reports');
  });

  it('jumps to the first and last tab', () => {
    expect(nextTabKey(KEYS, 'hotspots', 'Home')).toBe('queue');
    expect(nextTabKey(KEYS, 'queue', 'End')).toBe('reports');
  });

  it('ignores unrelated keys and unknown active tabs', () => {
    expect(nextTabKey(KEYS, 'queue', 'Enter')).toBeNull();
    expect(nextTabKey(KEYS, 'queue', 'Tab')).toBeNull();
    expect(nextTabKey(KEYS, 'missing', 'ArrowRight')).toBeNull();
  });
});
