import { CLUSTER_CELL_SIZE, OPEN_STATUSES } from './constants';
import { gridKey, isValidCoordinate } from './geo';

const DAY = 24 * 60 * 60 * 1000;

/** Count reports by any string key, e.g. `countBy(reports, (r) => r.status)`. */
export function countBy(reports = [], keyOf) {
  return reports.reduce((counts, report) => {
    const key = keyOf(report);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

/**
 * The dashboard filter. Every widget — KPIs, map, charts, ranking and hotspot
 * cards — must read the array this returns so they cannot disagree.
 */
export function filterReports(
  reports = [],
  { category = '', status = '', band = '', query = '' } = {},
) {
  const needle = String(query ?? '')
    .trim()
    .toLowerCase();

  return reports.filter((report) => {
    if (category && report.category !== category) return false;
    if (status && report.status !== status) return false;
    if (band && report.priorityBand !== band) return false;
    if (needle) {
      const haystack = `${report.referenceCode ?? ''} ${report.title ?? ''} ${
        report.description ?? ''
      } ${report.locationLabel ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * The label a human would use for a group of nearby reports: the most common
 * trailing part of the location labels ("4th Cross, Sector 12" → "Sector 12").
 * Shortest wins a tie so "Ward 4 Market" beats "Ward 4 Market entrance".
 */
export function areaLabel(reports = []) {
  const labels = reports
    .map((report) => String(report.locationLabel ?? '').trim())
    .filter(Boolean)
    .map((label) => label.split(',').pop().trim())
    .filter(Boolean);

  if (labels.length === 0) return 'Unnamed area';

  const counts = countBy(labels, (label) => label);
  return Object.keys(counts).sort(
    (a, b) => counts[b] - counts[a] || a.length - b.length || a.localeCompare(b),
  )[0];
}

function resolvedWithin(report, days, now) {
  if (report.status !== 'resolved' && report.status !== 'closed') return false;
  if (!report.resolvedAt) return false;
  const resolvedAt = new Date(report.resolvedAt).getTime();
  return Number.isFinite(resolvedAt) && now - resolvedAt <= days * DAY;
}

/**
 * Single source of truth for the Phase 2 KPIs. Every widget must derive from
 * this function so Home and Dashboard cannot disagree.
 */
export function summarizeReports(reports = [], { now = Date.now() } = {}) {
  const total = reports.length;
  const open = reports.filter((report) => OPEN_STATUSES.includes(report.status)).length;
  const p0p1 = reports.filter(
    (report) => report.priorityBand === 'P0' || report.priorityBand === 'P1',
  ).length;
  const resolved30 = reports.filter((report) => resolvedWithin(report, 30, now)).length;
  const duplicates = reports.filter(
    (report) => report.status === 'duplicate' || report.duplicateConfirmed,
  ).length;

  return {
    total,
    open,
    p0p1,
    resolved30,
    duplicates,
    duplicateRate: total === 0 ? 0 : duplicates / total,
    scored: reports.some((report) => Boolean(report.priorityBand)),
  };
}

/**
 * Raw 0.003° grid buckets with at least `minCount` reports.
 *
 * This is deliberately *not* the Phase 3 hotspot algorithm: it groups by a
 * fixed grid with no time window, score or trend. It exists so C2 can show the
 * two seeded geographic clusters before the AI pipeline lands.
 */
export function groupByArea(
  reports = [],
  { cellSize = CLUSTER_CELL_SIZE, minCount = 3 } = {},
) {
  const buckets = new Map();

  for (const report of reports) {
    if (!isValidCoordinate(report.latitude, report.longitude)) continue;
    const key = gridKey(report.latitude, report.longitude, cellSize);
    const bucket = buckets.get(key) ?? [];
    bucket.push(report);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .filter(([, members]) => members.length >= minCount)
    .map(([key, members]) => ({
      key,
      count: members.length,
      label: areaLabel(members),
      categories: countBy(members, (report) => report.category),
      open: members.filter((report) => OPEN_STATUSES.includes(report.status)).length,
      reports: members,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
