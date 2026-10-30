import { describe, expect, it } from 'vitest';
import { REPORT_LIMITS, validateReport, validateTrackingCode } from '@/lib/validation';

const VALID = {
  description: 'A pothole large enough to damage a two-wheeler on the test road.',
  category: 'roads',
  latitude: 12.9716,
  longitude: 77.5946,
};

describe('validateReport', () => {
  it('accepts a complete report', () => {
    expect(validateReport(VALID)).toEqual({ valid: true, errors: {} });
  });

  it('rejects a description shorter than 20 characters', () => {
    const result = validateReport({ ...VALID, description: 'Too short' });
    expect(result.valid).toBe(false);
    expect(result.errors.description).toContain('20');
  });

  it('rejects a description over the maximum length', () => {
    const result = validateReport({
      ...VALID,
      description: 'x'.repeat(REPORT_LIMITS.descriptionMax + 1),
    });
    expect(result.errors.description).toContain(String(REPORT_LIMITS.descriptionMax));
  });

  it('rejects a missing pin', () => {
    const result = validateReport({ ...VALID, latitude: '', longitude: '' });
    expect(result.errors.location).toBeDefined();
  });

  it('rejects a missing category', () => {
    expect(validateReport({ ...VALID, category: '' }).errors.category).toBeDefined();
  });

  it('rejects an image over 5 MB', () => {
    const result = validateReport({
      ...VALID,
      imageFile: { size: REPORT_LIMITS.imageBytes + 1 },
    });
    expect(result.errors.image).toContain('5 MB');
  });
});

describe('validateTrackingCode', () => {
  it('accepts a well-formed code in any case, with whitespace', () => {
    expect(validateTrackingCode('CP-7K2M9Q')).toBeNull();
    expect(validateTrackingCode(' cp-7k2m9q ')).toBeNull();
  });

  it('asks for a code when the field is empty', () => {
    expect(validateTrackingCode('')).toBe('Enter your tracking code.');
    expect(validateTrackingCode('   ')).toBe('Enter your tracking code.');
  });

  it('rejects malformed codes with a helpful example', () => {
    expect(validateTrackingCode('7K2M9Q')).toContain('CP-7K2M9Q');
    expect(validateTrackingCode('CP-123456')).toContain('CP-7K2M9Q');
    expect(validateTrackingCode('CP-7K2M9Q-EXTRA')).toContain('CP-7K2M9Q');
  });
});
