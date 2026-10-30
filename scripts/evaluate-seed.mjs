/**
 * Seed evaluation for the rules-v1 pipeline.
 *
 * Usage: node scripts/evaluate-seed.mjs
 *
 * Loads the real seed and AI modules through Vite so `@/` aliases and asset
 * imports resolve exactly as they do in the app. Prints the G3 metrics:
 * duplicate groups recovered, P0 concentration, clusters and low confidence.
 */
import { createServer } from 'vite';

const NOW = new Date('2026-10-30T12:00:00.000Z');

const DUPLICATE_GROUPS = [
  ['CP-7K2M9Q', 'CP-4T8N2R', 'CP-9X3P6M'],
  ['CP-9T3M7B', 'CP-4K8W2Y'],
  ['CP-7P5N9C', 'CP-3L6T4R'],
  ['CP-3R9C2V', 'CP-8M5J7T'],
  ['CP-4Y8R2N', 'CP-7C5M6H', 'CP-3V9K4L'],
  ['CP-8K2P7W', 'CP-5T6N3B'],
  ['CP-4P8C2V', 'CP-7B5R9Y'],
  ['CP-6R4Y5M', 'CP-9L8B3T'],
];

const server = await createServer({
  root: process.cwd(),
  configFile: 'vite.config.js',
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
});

try {
  const { buildSeedReports } = await server.ssrLoadModule('/src/services/local/seed.js');
  const { computeClusters } = await server.ssrLoadModule('/src/services/ai/clusters.js');

  const reports = buildSeedReports(NOW);
  const byCode = new Map(reports.map((report) => [report.referenceCode, report]));

  const surfaced = DUPLICATE_GROUPS.filter((group) => {
    const codes = new Set(group);
    return group.some((code) => {
      const report = byCode.get(code);
      return (report?.ai?.duplicates ?? []).some((candidate) => {
        const other = reports.find((item) => item.id === candidate.reportId);
        return other && codes.has(other.referenceCode);
      });
    });
  });

  const ranked = [...reports].sort(
    (a, b) => b.priorityScore - a.priorityScore ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const topFive = ranked.slice(0, 5);
  const p0 = ranked.filter((report) => report.priorityBand === 'P0');
  const p0InTopFive = p0.filter((report) => topFive.includes(report));

  const clusters = computeClusters(reports, { now: NOW });
  const lowConfidence = reports.filter((report) => report.ai?.lowConfidence);

  console.log('CivicPulse rules-v1 seed evaluation');
  console.log(`Now: ${NOW.toISOString()}`);
  console.log(`Reports: ${reports.length}`);
  console.log('');
  console.log(`Duplicate groups recovered: ${surfaced.length}/${DUPLICATE_GROUPS.length}`);
  for (const group of DUPLICATE_GROUPS) {
    const hit = surfaced.includes(group) ? 'PASS' : 'MISS';
    console.log(`  ${hit} ${group.join(', ')}`);
  }
  console.log('');
  console.log(`P0 in top 5: ${p0InTopFive.length}/${p0.length}`);
  for (const report of topFive) {
    console.log(
      `  #${topFive.indexOf(report) + 1} ${report.referenceCode} ${report.priorityBand} ${report.priorityScore} ${report.title}`,
    );
  }
  console.log('');
  console.log(
    `Priority mix: ${['P0', 'P1', 'P2', 'P3']
      .map((band) => `${band} ${reports.filter((report) => report.priorityBand === band).length}`)
      .join(' · ')}`,
  );
  console.log('');
  console.log(`Clusters found: ${clusters.length} (expected 2)`);
  for (const cluster of clusters) {
    console.log(
      `  ${cluster.label} | ${cluster.count} reports | radius ${cluster.radiusMeters} m | hotspot ${cluster.hotspotScore} | trend ${cluster.trend}`,
    );
  }
  console.log('');
  console.log(`Low-confidence classifications: ${lowConfidence.length}`);
  for (const report of lowConfidence) {
    console.log(`  ${report.referenceCode} ${report.ai.category} ${report.ai.confidence}`);
  }
  console.log('');
  console.log(
    `G3 result: ${surfaced.length >= 6 && p0InTopFive.length === p0.length && clusters.length === 2 ? 'PASS' : 'FAIL'}`,
  );
} finally {
  await server.close();
}
