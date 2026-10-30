import { describe, expect, it } from 'vitest';
import {
  centroid,
  distanceMeters,
  formatMeters,
  gridKey,
  isValidCoordinate,
  radiusMeters,
} from '@/lib/geo';

describe('distanceMeters', () => {
  it('returns Infinity when a point is missing', () => {
    expect(distanceMeters(null, { latitude: 1, longitude: 1 })).toBe(Infinity);
    expect(distanceMeters({ latitude: 1, longitude: 1 }, null)).toBe(Infinity);
  });

  it('returns zero for the same point', () => {
    const point = { latitude: 12.9716, longitude: 77.5946 };
    expect(distanceMeters(point, point)).toBe(0);
  });

  it('approximates one degree of latitude in metres', () => {
    const metres = distanceMeters(
      { latitude: 12, longitude: 77 },
      { latitude: 13, longitude: 77 },
    );
    expect(metres).toBeGreaterThan(110000);
    expect(metres).toBeLessThan(112500);
  });
});

describe('gridKey', () => {
  it('groups points inside the same cell and separates neighbouring cells', () => {
    expect(gridKey(12.9701, 77.5901)).toBe(gridKey(12.9719, 77.5919));
    expect(gridKey(12.9701, 77.5901)).not.toBe(gridKey(12.974, 77.5901));
  });

  it('floors negative coordinates instead of truncating toward zero', () => {
    expect(gridKey(-0.0001, -0.0001)).toBe('-1:-1');
  });
});

describe('centroid and radiusMeters', () => {
  it('averages the member coordinates', () => {
    expect(
      centroid([
        { latitude: 10, longitude: 20 },
        { latitude: 20, longitude: 40 },
      ]),
    ).toEqual({ latitude: 15, longitude: 30 });
  });

  it('returns null or zero for empty input', () => {
    expect(centroid([])).toBeNull();
    expect(radiusMeters([])).toBe(0);
  });

  it('measures the farthest member from the centre', () => {
    const points = [
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9717, longitude: 77.5946 },
    ];
    const radius = radiusMeters(points);
    expect(radius).toBeGreaterThan(0);
    expect(radius).toBeLessThan(20);
  });
});

describe('formatMeters', () => {
  it('rounds metres and switches to kilometres', () => {
    expect(formatMeters(48.4)).toBe('48 m');
    expect(formatMeters(1234)).toBe('1.2 km');
    expect(formatMeters(Number.NaN)).toBe('—');
  });
});

describe('isValidCoordinate', () => {
  it('accepts in-range numbers and numeric strings', () => {
    expect(isValidCoordinate(12.9716, 77.5946)).toBe(true);
    expect(isValidCoordinate('12.9716', '77.5946')).toBe(true);
    expect(isValidCoordinate(0, 0)).toBe(true);
  });

  it('rejects empty strings, out-of-range values and non-numbers', () => {
    expect(isValidCoordinate('', '')).toBe(false);
    expect(isValidCoordinate(null, 77)).toBe(false);
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate('north', 'east')).toBe(false);
  });
});
