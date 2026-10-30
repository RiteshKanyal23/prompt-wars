import { describe, expect, it } from 'vitest';
import {
  createReferenceCode,
  isValidReferenceCode,
  normalizeReferenceCode,
  REFERENCE_ALPHABET,
} from '@/lib/referenceCode';

describe('createReferenceCode', () => {
  it('produces a CP- prefix and six unambiguous characters', () => {
    const code = createReferenceCode();
    expect(code).toMatch(/^CP-[A-Z2-9]{6}$/);
    expect(code).toHaveLength(9);
  });

  it('uses only the Crockford-style alphabet', () => {
    expect(REFERENCE_ALPHABET).not.toMatch(/[IO01]/);
    for (let index = 0; index < 50; index += 1) {
      const body = createReferenceCode().slice(3);
      for (const character of body) expect(REFERENCE_ALPHABET).toContain(character);
    }
  });

  it('supports a custom length', () => {
    expect(createReferenceCode(4)).toHaveLength(7);
  });
});

describe('normalizeReferenceCode', () => {
  it('trims and uppercases input', () => {
    expect(normalizeReferenceCode('  cp-7k2m9q ')).toBe('CP-7K2M9Q');
    expect(normalizeReferenceCode(null)).toBe('');
  });
});

describe('isValidReferenceCode', () => {
  it('accepts well-formed codes in any case', () => {
    expect(isValidReferenceCode('CP-7K2M9Q')).toBe(true);
    expect(isValidReferenceCode(' cp-7k2m9q ')).toBe(true);
  });

  it('rejects wrong prefixes, lengths and ambiguous characters', () => {
    expect(isValidReferenceCode('XX-7K2M9Q')).toBe(false);
    expect(isValidReferenceCode('CP-7K2M9')).toBe(false);
    expect(isValidReferenceCode('CP-7K2M9O')).toBe(false);
    expect(isValidReferenceCode('')).toBe(false);
  });
});
