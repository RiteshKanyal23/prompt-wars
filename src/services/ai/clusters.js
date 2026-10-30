import {
  CLUSTER_CELL_SIZE,
  CLUSTER_MIN_REPORTS,
  CLUSTER_WINDOW_DAYS,
  CATEGORY_MAP,
} from '@/lib/constants';
import { distanceMeters } from '@/lib/geo';

const DAY_MS = 86_400_000;

export function cellKey(latitude, longitude) {
  return `${Math.floor(Number(latitude) / CLUSTER_CELL_SIZE)}:${Math.floor(Number(longitude) / CLUSTER_CELL_SIZE)}`;
}

function centroid(members) {
  const latitude = members.reduce((sum, report) => sum + Number(report.latitude), 0) / members.length;
  const longitude = members.reduce((sum, report) => sum + Number(report.longitude), 0) / members.length;
  return { latitude, longitude };
}

function buildCluster(key, members, nowMs) {
  const sorted = [...members].sort(
    (a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0),
  );
  const center = centroid(sorted);
  const radiusMeters = Math.max(
    30,
    ...sorted.map((report) => distanceMeters(center, report)),
  );

  const categories = {};
  let prioritySum = 0;
  for (const report of sorted) {
    categories[report.category] = (categories[report.category] || 0) + 1;
    prioritySum += report.priorityScore ?? report.ai?.priority?.score ?? 0;
  }
  const distinctCategories = Object.keys(categories).length;
  const avgPriority = Math.round(prioritySum / sorted.length);

  const last7 = sorted.filter((report) => nowMs - new Date(report.createdAt).getTime() <= 7 * DAY_MS).length;
  const prev7 = sorted.filter((report) => {
    const age = nowMs - new Date(report.createdAt).getTime();
    return age > 7 * DAY_MS && age <= 14 * DAY_MS;
  }).length;
  const trend = last7 > prev7 ? 'rising' : last7 < prev7 ? 'falling' : 'steady';

  const hotspotScore = Math.round(
    40 * Math.min(sorted.length / 6, 1) +
    20 * Math.min(distinctCategories / 3, 1) +
    40 * (avgPriority / 100),
  );

  const labelCounts = {};
  for (const report of sorted) {
    if (report.locationLabel) labelCounts[report.locationLabel] = (labelCounts[report.locationLabel] || 0) + 1;
  }
  const label = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? `Grid ${key}`;

  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other';

  return {
    id: `cluster-${key.replace(':', '-')}`,
    key,
    label,
    latitude: center.latitude,
    longitude: center.longitude,
    count: sorted.length,
    categories,
    distinctCategories,
    topCategory,
    topCategoryLabel: CATEGORY_MAP[topCategory]?.label ?? topCategory,
    avgPriority,
    hotspotScore,
    radiusMeters: Math.round(radiusMeters),
    trend,
    firstSeen: sorted.map((report) => report.createdAt).sort()[0],
    lastSeen: sorted.map((report) => report.createdAt).sort().at(-1),
    members: sorted,
  };
}

export function computeClusters(reports, {
  now = new Date(),
  windowDays = CLUSTER_WINDOW_DAYS,
  minReports = CLUSTER_MIN_REPORTS,
} = {}) {
  const nowMs = new Date(now).getTime();
  const cutoff = nowMs - windowDays * DAY_MS;

  const eligible = reports.filter((report) => {
    const created = new Date(report.createdAt ?? 0).getTime();
    return (
      Number.isFinite(Number(report.latitude)) &&
      Number.isFinite(Number(report.longitude)) &&
      Number.isFinite(created) &&
      created >= cutoff &&
      // Linked duplicates are evidence, not independent reports: they are
      // attached to their parent's cluster after grouping (below) so they can
      // never create a cluster on their own.
      !['rejected', 'duplicate'].includes(report.status)
    );
  });

  const groups = new Map();
  for (const report of eligible) {
    const key = cellKey(report.latitude, report.longitude);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(report);
  }

  const clusters = [];
  for (const [key, members] of groups) {
    if (members.length >= minReports) clusters.push(buildCluster(key, members, nowMs));
  }

  // Attach a confirmed duplicate to the cluster that contains its parent. This
  // keeps the hotspot count honest without letting a duplicate manufacture a
  // hotspot where only one original report exists.
  const byId = new Map(reports.map((report) => [report.id, report]));
  const byCode = new Map(reports.map((report) => [report.referenceCode, report]));
  const clusterByMemberId = new Map();
  for (const cluster of clusters) {
    for (const member of cluster.members) clusterByMemberId.set(member.id, cluster);
  }

  const attached = new Set();
  for (const report of reports) {
    if (report.status !== 'duplicate' || attached.has(report.id)) continue;
    const parent = byId.get(report.duplicateOf) ?? byCode.get(report.duplicateOf);
    const cluster = parent ? clusterByMemberId.get(parent.id) : null;
    if (!cluster) continue;
    cluster.members = [...cluster.members, report];
    attached.add(report.id);
  }

  for (let index = 0; index < clusters.length; index += 1) {
    if (clusters[index].count !== clusters[index].members.length) {
      clusters[index] = buildCluster(clusters[index].key, clusters[index].members, nowMs);
    }
  }

  return clusters.sort((a, b) => b.hotspotScore - a.hotspotScore);
}

export function findClusterForReport(report, clusters) {
  return clusters.find((cluster) => cluster.members.some((member) => member.id === report.id)) ?? null;
}
