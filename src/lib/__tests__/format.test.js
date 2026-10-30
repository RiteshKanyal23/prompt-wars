import { describe, expect, it } from 'vitest';
import {
  clone,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  timeAgo,
  titleCase,
  truncate,
} from '@/lib/format';

const NOW = new Date('2026-10-30T12:00:00.000Z');

describe('timeAgo', () => {
  it('uses short relative buckets', () => {
    expect(timeAgo('2026-10-30T11:59:40.000Z', NOW)).toBe('just now');
    expect(timeAgo('2026-10-30T11:48:00.000Z', NOW)).toBe('12 min ago');
    expect(timeAgo('2026-10-30T09:00:00.000Z', NOW)).toBe('3 h ago');
    expect(timeAgo('2026-10-28T12:00:00.000Z', NOW)).toBe('2 d ago');
  });

  it('clamps future timestamps and handles bad input', () => {
    expect(timeAgo('2026-10-31T12:00:00.000Z', NOW)).toBe('just now');
    expect(timeAgo(null, NOW)).toBe('—');
    expect(timeAgo('not-a-date', NOW)).toBe('—');
  });
});

describe('date formatting', () => {
  it('formats valid ISO dates and rejects bad ones', () => {
    expect(formatDate('2026-10-30T12:00:00.000Z')).toContain('2026');
    expect(formatDateTime('2026-10-30T12:00:00.000Z')).toContain('2026');
    expect(formatDate('')).toBe('—');
    expect(formatDateTime('nope')).toBe('—');
  });
});

describe('truncate', () => {
  it('leaves short text untouched and trims whitespace', () => {
    expect(truncate('  short text  ', 40)).toBe('short text');
  });

  it('adds an ellipsis and never exceeds the limit', () => {
    const result = truncate('a'.repeat(50), 20);
    expect(result).toHaveLength(20);
    expect(result.endsWith('…')).toBe(true);
  });

  it('treats null as an empty string', () => {
    expect(truncate(null)).toBe('');
  });
});

describe('number and percent formatting', () => {
  it('groups thousands and renders percent with digits', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber('42')).toBe('42');
    expect(formatPercent(0.79)).toBe('79%');
    expect(formatPercent(0.9876, 2)).toBe('98.76%');
  });

  it('returns an em dash for non-finite values', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
  });
});

describe('titleCase and clone', () => {
  it('turns snake_case into title case', () => {
    expect(titleCase('in_progress')).toBe('In Progress');
    expect(titleCase(null)).toBe('');
  });

  it('deep-clones objects without sharing references', () => {
    const source = { a: 1, nested: { b: 2 } };
    const copy = clone(source);
    copy.nested.b = 3;
    expect(source.nested.b).toBe(2);
    expect(clone(null)).toBeNull();
    expect(clone(7)).toBe(7);
  });
});
