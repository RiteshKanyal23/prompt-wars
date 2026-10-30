import { describe, expect, it } from 'vitest';
import { buildSeedReports } from '@/services/local/seed';
import { computeClusters } from '@/services/ai/clusters';
import { filterReports, groupByArea, summarizeReports, countBy } from '@/lib/reportStats';

const NOW = new Date('2026-10-30T12:00:00.000Z');
const reports = buildSeedReports(NOW);

describe('summarizeReports', () => {
  it('computes every Phase 2 KPI from the same array', () => {
    const summary = summarizeReports(reports, { now: NOW.getTime() });

    expect(summary).toMatchObject({
      total: 42,
      open: 27,
      resolved30: 11,
      duplicates: 2,
    });
    expect(summary.duplicateRate).toBeCloseTo(2 / 42);
    expect(summary.p0p1).toBe(
      reports.filter(
        (report) => report.priorityBand === 'P0' || report.priorityBand === 'P1',
      ).length,
    );
  });

  it('handles an empty array without dividing by zero', () => {
    expect(summarizeReports([])).toMatchObject({
      total: 0,
      open: 0,
      duplicateRate: 0,
      scored: false,
    });
  });
});

describe('filterReports', () => {
  it('returns the whole corpus when no filter is set', () => {
    expect(filterReports(reports)).toHaveLength(42);
  });

  it('composes category, status and band filters', () => {
    const filtered = filterReports(reports, {
      category: 'water',
      status: 'resolved',
      band: 'P2',
    });

    for (const report of filtered) {
      expect(report).toMatchObject({ category: 'water', status: 'resolved', priorityBand: 'P2' });
    }
    expect(filtered).toEqual(
      reports.filter(
        (report) =>
          report.category === 'water' &&
          report.status === 'resolved' &&
          report.priorityBand === 'P2',
      ),
    );
  });

  it('searches code, title, description and location case-insensitively', () => {
    const sample = reports[0];
    const needle = sample.referenceCode.toLowerCase();

    expect(filterReports(reports, { query: `  ${needle}  ` })).toEqual([sample]);
    expect(filterReports(reports, { query: 'sector 12' }).length).toBeGreaterThan(0);
    expect(filterReports(reports, { query: 'no-such-report-anywhere' })).toEqual([]);
  });

  it('produces KPI counts that match a manual count on the same filters', () => {
    const filtered = filterReports(reports, { band: 'P0' });
    const summary = summarizeReports(filtered, { now: NOW.getTime() });

    expect(summary.total).toBe(filtered.length);
    expect(summary.open).toBe(
      filtered.filter((report) =>
        ['submitted', 'triaged', 'assigned', 'in_progress'].includes(report.status),
      ).length,
    );
    expect(summary.p0p1).toBe(filtered.filter((report) => report.priorityBand === 'P0').length);
  });
});

describe('dashboard hotspot consistency', () => {
  it('recomputes clusters from the filtered array, never the hidden reports', () => {
    const water = filterReports(reports, { category: 'water' });
    const clusters = computeClusters(water);

    expect(clusters.length).toBeGreaterThan(0);
    for (const cluster of clusters) {
      expect(cluster.members.length).toBe(cluster.count);
      expect(cluster.members.every((member) => member.category === 'water')).toBe(true);
      expect(cluster.count).toBeLessThanOrEqual(water.length);
    }

    const sector12 = clusters.find((cluster) => cluster.label.includes('Sector 12'));
    expect(sector12?.count).toBe(5);
  });
});

describe('groupByArea', () => {
  it('surfaces the two seeded geographic groups', () => {
    const areas = groupByArea(reports);
    const byLabel = Object.fromEntries(areas.map((area) => [area.label, area]));

    expect(byLabel['Sector 12']).toMatchObject({ count: 7 });
    expect(byLabel['Ward 4 Market']).toMatchObject({ count: 5 });
  });

  it('does not merge distant reports into one bucket', () => {
    const areas = groupByArea(reports);
    const sector12 = areas.find((area) => area.label === 'Sector 12');
    const ward4 = areas.find((area) => area.label === 'Ward 4 Market');

    expect(sector12.key).not.toBe(ward4.key);
    expect(countBy(sector12.reports, (report) => report.category)).toMatchObject({
      water: 5,
      roads: 2,
    });
    expect(countBy(ward4.reports, (report) => report.category)).toEqual({ waste: 5 });
  });

  it('respects the minimum-count option', () => {
    expect(groupByArea(reports, { minCount: 6 })).toHaveLength(1);
    expect(groupByArea(reports, { minCount: 10 })).toHaveLength(0);
  });
});
