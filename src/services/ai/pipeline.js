import { AI_VERSION } from '@/lib/constants';
import { classifyReport } from './classify';
import { summarizeReport } from './summarize';
import { findDuplicateCandidates } from './duplicates';
import { computeClusters, findClusterForReport } from './clusters';
import { computePriority } from './priority';

/**
 * Run the full rules-v1 pipeline for one report.
 *
 * @param {import('@/types').Report} report
 * @param {import('@/types').Report[]} corpus reports excluding `report`
 * @param {{now?: Date}} [options]
 * @returns {import('@/types').AiAnalysis}
 */
export function analyzeReport(report, corpus = [], { now = new Date() } = {}) {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const classification = classifyReport(report);
  const summary = summarizeReport({
    title: report.title ?? '',
    description: report.description ?? '',
    category: classification.category,
  });

  const duplicates = findDuplicateCandidates(report, corpus, { now });

  const allReports = [...corpus.filter((item) => item.id !== report.id), report];
  const clusters = computeClusters(allReports, { now });
  const cluster = findClusterForReport(report, clusters);

  const confirmedDuplicates = corpus.filter(
    (item) => item.duplicateOf === report.id && item.duplicateConfirmed,
  ).length;

  const priority = computePriority({
    category: classification.category,
    title: report.title ?? '',
    description: report.description ?? '',
    clusterCount: cluster?.count ?? 1,
    confirmedDuplicates,
    createdAt: report.createdAt,
    now,
  });

  const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    version: AI_VERSION,
    category: classification.category,
    confidence: classification.confidence,
    lowConfidence: classification.lowConfidence,
    alternatives: classification.alternatives,
    matchedTerms: classification.matches,
    summary,
    duplicates,
    priority,
    cluster: cluster
      ? {
          key: cluster.key,
          id: cluster.id,
          label: cluster.label,
          count: cluster.count,
          categories: cluster.categories,
          avgPriority: cluster.avgPriority,
          hotspotScore: cluster.hotspotScore,
          radiusMeters: cluster.radiusMeters,
          trend: cluster.trend,
        }
      : null,
    processingMs: Math.max(1, Math.round(ended - started)),
    processedAt: new Date(now).toISOString(),
    deterministic: true,
  };
}
