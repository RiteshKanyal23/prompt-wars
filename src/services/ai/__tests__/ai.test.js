import { describe, expect, it } from 'vitest';
import { analyzeReport } from '@/services/ai/pipeline';
import { bandForScore, computePriority } from '@/services/ai/priority';
import { computeClusters } from '@/services/ai/clusters';
import { classifyReport } from '@/services/ai/classify';
import { summarizeReport } from '@/services/ai/summarize';
import { findDuplicateCandidates } from '@/services/ai/duplicates';
import { buildActionBrief } from '@/services/ai/brief';
import { buildSeedReports } from '@/services/local/seed';

const NOW = new Date('2026-10-30T09:00:00.000Z');
const SEED_NOW = new Date('2026-10-30T12:00:00.000Z');

function report(overrides = {}) {
  return {
    id: 'r1',
    referenceCode: 'CP-TEST01',
    title: 'Drain overflowing near school',
    description:
      'The storm drain outside Sunrise School has been overflowing since last night. Water is knee deep and children walk through it.',
    category: 'water',
    latitude: 12.9716,
    longitude: 77.5946,
    status: 'submitted',
    priorityScore: null,
    priorityBand: null,
    createdAt: '2026-10-30T03:00:00.000Z',
    ...overrides,
  };
}

describe('classification', () => {
  it('detects water and drainage', () => {
    const result = classifyReport(report());
    expect(result.category).toBe('water');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it('falls back to other with low confidence', () => {
    const result = classifyReport({ title: '', description: 'zxqv blorf' });
    expect(result.category).toBe('other');
    expect(result.lowConfidence).toBe(true);
  });
});

describe('priority', () => {
  it('uses the documented band boundaries', () => {
    expect(bandForScore(100)).toBe('P0');
    expect(bandForScore(80)).toBe('P0');
    expect(bandForScore(79)).toBe('P1');
    expect(bandForScore(60)).toBe('P1');
    expect(bandForScore(59)).toBe('P2');
    expect(bandForScore(40)).toBe('P2');
    expect(bandForScore(39)).toBe('P3');
    expect(bandForScore(0)).toBe('P3');
  });

  it('factor points sum to the score', () => {
    const result = computePriority({
      category: 'public_safety',
      title: 'Live wire',
      description: 'Live wire hanging near the school bus stop, sparking at night.',
      clusterCount: 4,
      confirmedDuplicates: 1,
      createdAt: '2026-10-30T08:00:00.000Z',
      now: NOW,
    });
    const sum = result.factors.reduce((total, factor) => total + factor.points, 0);
    expect(sum).toBe(result.score);
    expect(result.band).toBe('P0');
  });

  it('escalates a critical hazard to the P0 floor and keeps factors consistent', () => {
    const result = computePriority({
      category: 'sanitation',
      title: 'Open manhole near school',
      description: 'A manhole cover is missing and children walk past the open hole every morning.',
      clusterCount: 1,
      confirmedDuplicates: 0,
      createdAt: '2026-10-20T08:55:00.000Z',
      now: NOW,
    });
    const sum = result.factors.reduce((total, factor) => total + factor.points, 0);

    expect(result.score).toBe(80);
    expect(sum).toBe(80);
    expect(result.band).toBe('P0');
    expect(result.factors.some((factor) => factor.code === 'hazard')).toBe(true);
    expect(result.criticalHazards).toContain('open manhole');
  });

  it('does not escalate a predicted collapse in the future', () => {
    const result = computePriority({
      category: 'roads',
      title: 'Road may collapse',
      description: 'The road is cracked and might collapse if heavy vehicles keep using this route.',
      createdAt: '2026-10-20T08:55:00.000Z',
      now: NOW,
    });

    expect(result.band).not.toBe('P0');
    expect(result.criticalHazards).toHaveLength(0);
  });
});

describe('duplicates', () => {
  it('scores an identical nearby report as strong', () => {
    const target = report();
    const candidate = report({
      id: 'r2',
      referenceCode: 'CP-TEST02',
      createdAt: '2026-10-30T05:00:00.000Z',
    });
    const result = analyzeReport(target, [candidate], { now: NOW });
    expect(result.duplicates[0].level).toBe('strong');
    expect(result.duplicates[0].components.text).toBeGreaterThan(0.9);
  });

  it('does not match a distant report', () => {
    const target = report();
    const candidate = report({
      id: 'r3',
      referenceCode: 'CP-TEST03',
      latitude: 13.05,
      longitude: 77.7,
      createdAt: '2026-10-29T05:00:00.000Z',
    });
    const result = analyzeReport(target, [candidate], { now: NOW });
    expect(result.duplicates).toHaveLength(0);
  });

  it('excludes self, rejected and duplicate reports', () => {
    const target = report();
    const self = report();
    const rejected = report({ id: 'r4', referenceCode: 'CP-TEST04', status: 'rejected' });
    const duplicate = report({ id: 'r5', referenceCode: 'CP-TEST05', status: 'duplicate' });

    const candidates = findDuplicateCandidates(target, [self, rejected, duplicate], { now: NOW });
    expect(candidates).toHaveLength(0);
  });
});

describe('clusters', () => {
  it('finds three reports in one grid cell', () => {
    const reports = [
      report({ id: 'a', createdAt: '2026-10-29T08:00:00.000Z' }),
      report({ id: 'b', latitude: 12.9717, longitude: 77.5947, createdAt: '2026-10-28T08:00:00.000Z' }),
      report({ id: 'c', latitude: 12.9718, longitude: 77.5948, createdAt: '2026-10-27T08:00:00.000Z' }),
    ];
    const clusters = computeClusters(reports, { now: NOW });
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(3);
    expect(clusters[0].hotspotScore).toBeGreaterThan(0);
  });

  it('builds a mocked action brief from real cluster fields', () => {
    const reports = [
      report({ id: 'a', priorityBand: 'P0', priorityScore: 92, category: 'water' }),
      report({ id: 'b', latitude: 12.9717, priorityBand: 'P1', priorityScore: 70 }),
      report({ id: 'c', latitude: 12.9718, priorityBand: 'P2', priorityScore: 44, category: 'roads' }),
    ];
    const [cluster] = computeClusters(reports, { now: NOW });
    const brief = buildActionBrief(cluster);

    expect(brief.title).toContain(cluster.label);
    expect(brief.pattern).toContain('3 reports');
    expect(brief.risk).toContain('2 high-priority');
    expect(brief.mocked).toMatch(/recommendation only/i);
  });
});

describe('summary and determinism', () => {
  it('keeps summaries under 220 characters', () => {
    const summary = summarizeReport({ ...report(), category: 'water' });
    expect(summary.length).toBeLessThanOrEqual(220);
  });

  it('returns identical output for identical input', () => {
    const a = analyzeReport(report(), [], { now: NOW });
    const b = analyzeReport(report(), [], { now: NOW });
    expect({ ...a, processingMs: 0 }).toEqual({ ...b, processingMs: 0 });
  });
});

describe('seed acceptance', () => {
  const reports = buildSeedReports(SEED_NOW);

  it('analyses every seeded report with rules-v1', () => {
    expect(reports).toHaveLength(42);
    for (const seeded of reports) {
      expect(seeded.ai.version).toBe('rules-v1');
      expect(seeded.ai.summary.length).toBeGreaterThan(0);
      expect(seeded.priorityScore).toBe(seeded.ai.priority.score);
      expect(seeded.priorityBand).toBe(seeded.ai.priority.band);
    }
  });

  it('puts all three P0 reports in the top five', () => {
    const ranked = [...reports].sort(
      (a, b) => b.priorityScore - a.priorityScore ||
        new Date(b.createdAt) - new Date(a.createdAt),
    );
    const p0 = ranked.filter((seeded) => seeded.priorityBand === 'P0');
    const topFive = new Set(ranked.slice(0, 5).map((seeded) => seeded.id));

    expect(p0).toHaveLength(3);
    expect(p0.every((seeded) => topFive.has(seeded.id))).toBe(true);
  });

  it('detects exactly two hotspot clusters', () => {
    expect(computeClusters(reports, { now: SEED_NOW })).toHaveLength(2);
  });

  it('produces byte-identical analyses for the same clock', () => {
    const again = buildSeedReports(SEED_NOW);
    const strip = (seeded) => ({
      ...seeded,
      ai: { ...seeded.ai, processingMs: 0 },
    });
    expect(again.map(strip)).toEqual(reports.map(strip));
  });
});
