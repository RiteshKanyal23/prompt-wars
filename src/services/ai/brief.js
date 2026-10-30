import { CATEGORY_MAP } from '@/lib/constants';

const OWNER_BY_CATEGORY = {
  water: 'Drainage Cell',
  roads: 'Public Works',
  waste: 'Sanitation',
  electricity: 'Electrical',
  sanitation: 'Public Health',
  public_safety: 'Public Safety',
  other: 'Ward Office',
};

/**
 * Template-generated action brief. Every fact comes from real cluster fields;
 * nothing is inferred or invented. The UI must keep the mocked note visible.
 */
export function buildActionBrief(cluster) {
  if (!cluster) return null;

  const categorySummary = Object.entries(cluster.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${CATEGORY_MAP[key]?.label ?? key} (${count})`)
    .join(', ');

  const topReports = cluster.members.slice(0, 3);
  const urgent = cluster.members.filter((report) => ['P0', 'P1'].includes(report.priorityBand)).length;
  const owner = OWNER_BY_CATEGORY[cluster.topCategory] ?? 'Ward Office';

  return {
    title: `Action brief \u2014 ${cluster.label}`,
    location: `${cluster.label} (${cluster.latitude.toFixed(4)}, ${cluster.longitude.toFixed(4)})`,
    pattern: `${cluster.count} reports in the last 30 days within ~${cluster.radiusMeters} m, spanning ${categorySummary}.`,
    risk: `${urgent} high-priority report(s); average priority ${cluster.avgPriority}/100; trend ${cluster.trend}.`,
    owner,
    action: `Inspect ${cluster.topCategoryLabel.toLowerCase()} infrastructure at ${cluster.label} within 24 hours, clear the immediate hazard, and confirm whether the reports share one root cause.`,
    evidence: topReports.map(
      (report) => `${report.referenceCode} \u2014 ${report.title || report.description.slice(0, 60)}`,
    ),
    confidence: cluster.count >= 5 ? 'Medium-high (grid cluster, synthetic data)' : 'Medium (small cluster)',
    mocked: 'No work order has been dispatched. This brief is a recommendation only.',
  };
}
