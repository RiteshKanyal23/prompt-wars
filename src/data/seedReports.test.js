import { describe, expect, it } from 'vitest';
import { seedDuplicateGroups, seedReports } from '@/data/seedReports';
import { buildSeedReports } from '@/services/local/seed';
import { countBy } from '@/lib/reportStats';

const NOW = new Date('2026-10-30T12:00:00.000Z');

const CATEGORY_COUNTS = {
  water: 11,
  roads: 9,
  waste: 8,
  electricity: 6,
  sanitation: 4,
  public_safety: 3,
  other: 1,
};

const STATUS_COUNTS = {
  submitted: 8,
  triaged: 7,
  assigned: 6,
  in_progress: 6,
  resolved: 9,
  closed: 2,
  rejected: 2,
  duplicate: 2,
};

describe('authored seed', () => {
  it('contains the frozen 42-report composition', () => {
    expect(seedReports).toHaveLength(42);
    expect(countBy(seedReports, (report) => report.category)).toEqual(CATEGORY_COUNTS);
    expect(countBy(seedReports, (report) => report.status)).toEqual(STATUS_COUNTS);
  });

  it('declares eight duplicate groups covering nineteen reports', () => {
    expect(seedDuplicateGroups).toHaveLength(8);
    expect(seedDuplicateGroups.flat()).toHaveLength(19);
    expect(new Set(seedDuplicateGroups.flat()).size).toBe(19);

    for (const group of seedDuplicateGroups) {
      expect(group.length).toBeGreaterThanOrEqual(2);
      for (const code of group) {
        expect(seedReports.some((report) => report.referenceCode === code)).toBe(true);
      }
    }
  });

  it('keeps six reports inside the fresh 48-hour demo window', () => {
    expect(seedReports.filter((report) => report.createdDaysAgo <= 2)).toHaveLength(6);
  });
});

describe('relative seed timestamps', () => {
  const reports = buildSeedReports(NOW);

  it('converts every relative timestamp against the supplied clock', () => {
    for (const report of reports) {
      expect(new Date(report.createdAt).getTime()).toBeLessThanOrEqual(NOW.getTime());
      expect(new Date(report.updatedAt).getTime()).toBeLessThanOrEqual(NOW.getTime());
    }

    const fresh = reports.filter(
      (report) => NOW.getTime() - new Date(report.createdAt).getTime() <= 48 * 60 * 60 * 1000,
    );
    expect(fresh).toHaveLength(6);
  });

  it('points every linked duplicate at a report in its own group', () => {
    const codeToGroup = new Map();
    for (const group of seedDuplicateGroups) {
      for (const code of group) codeToGroup.set(code, group);
    }

    const linked = reports.filter((report) => report.status === 'duplicate');
    expect(linked).toHaveLength(2);

    for (const report of linked) {
      const group = codeToGroup.get(report.referenceCode);
      expect(group).toBeDefined();
      expect(group).toContain(report.duplicateOf);
    }
  });
});
