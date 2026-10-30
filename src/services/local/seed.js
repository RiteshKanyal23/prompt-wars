import { AI_VERSION } from '@/lib/constants';
import { seedReports } from '@/data/seedReports';
import { computeClusters } from '@/services/ai/clusters';
import { analyzeReport } from '@/services/ai/pipeline';
import { STORAGE_KEYS, isStorageAvailable, readJson, writeJson } from './storage';

const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Bump when the derived seed shape changes so stale local stores are rebuilt. */
export const SEED_VERSION = 3;

/** Statuses that imply the report moved past `submitted`. */
const STATUS_FLOW = ['submitted', 'triaged', 'assigned', 'in_progress', 'resolved', 'closed'];

const STATUS_OFFSET_HOURS = {
  submitted: 0,
  triaged: 6,
  assigned: 24,
  in_progress: 36,
  resolved: null,
  closed: null,
  rejected: 48,
  duplicate: 24,
};

const iso = (date) => date.toISOString();

const addHours = (date, hours) => new Date(date.getTime() + hours * HOUR);

/**
 * Converts the authored rows (which use relative `createdDaysAgo`) into the
 * domain Report shape. Deterministic for a given `now`, so tests can freeze it.
 *
 * AI fields are derived by the rules-v1 pipeline at seed time — never
 * hand-authored — so the demo can never show stale numbers.
 */
export function buildSeedReports(now = new Date()) {
  const baseReports = seedReports.map(({ createdDaysAgo, resolvedDaysAgo, ...row }) => {
    const createdAt = new Date(now.getTime() - createdDaysAgo * DAY);
    const resolvedAt =
      resolvedDaysAgo === undefined
        ? null
        : new Date(now.getTime() - resolvedDaysAgo * DAY);

    let updatedAt;
    if (row.status === 'resolved' || row.status === 'closed' || row.status === 'duplicate') {
      updatedAt = resolvedAt ?? addHours(createdAt, STATUS_OFFSET_HOURS[row.status] ?? 24);
    } else {
      updatedAt = addHours(createdAt, STATUS_OFFSET_HOURS[row.status] ?? 0);
    }
    if (updatedAt.getTime() > now.getTime()) updatedAt = new Date(now.getTime() - MINUTE);

    return {
      ...row,
      citizenId: null,
      slaDueAt: null,
      priorityScore: null,
      priorityBand: null,
      ai: null,
      clusterKey: null,
      createdAt: iso(createdAt),
      updatedAt: iso(updatedAt),
      resolvedAt: resolvedAt ? iso(resolvedAt) : null,
    };
  });

  return enrichReportsWithAi(baseReports, now);
}

function clusterSnapshot(cluster) {
  return {
    key: cluster.key,
    id: cluster.id,
    label: cluster.label,
    count: cluster.count,
    categories: cluster.categories,
    avgPriority: cluster.avgPriority,
    hotspotScore: cluster.hotspotScore,
    radiusMeters: cluster.radiusMeters,
    trend: cluster.trend,
  };
}

/**
 * Two-pass seed analysis:
 *   1. analyse every report against the full corpus, so duplicate candidates
 *      and cluster counts are real;
 *   2. recompute clusters after every priority score exists, then refresh the
 *      stored cluster snapshots.
 */
export function enrichReportsWithAi(reports, now = new Date()) {
  const enriched = reports.map((report) => ({ ...report }));

  for (let index = 0; index < enriched.length; index += 1) {
    const corpus = enriched.filter((_, otherIndex) => otherIndex !== index);
    const ai = analyzeReport(enriched[index], corpus, { now });
    enriched[index] = {
      ...enriched[index],
      ai,
      priorityScore: ai.priority.score,
      priorityBand: ai.priority.band,
      clusterKey: ai.cluster?.key ?? null,
    };
  }

  const clusters = computeClusters(enriched, { now });
  for (const report of enriched) {
    const cluster = clusters.find((item) =>
      item.members.some((member) => member.id === report.id));
    if (!cluster) continue;
    report.clusterKey = cluster.key;
    report.ai = { ...report.ai, cluster: clusterSnapshot(cluster) };
  }

  return enriched;
}

function event(report, suffix, type, createdAt, fields = {}) {
  return {
    id: `${report.id}-${suffix}`,
    reportId: report.id,
    actorId: null,
    actorRole: fields.actorRole ?? 'system',
    type,
    fromStatus: fields.fromStatus ?? null,
    toStatus: fields.toStatus ?? null,
    isPublic: fields.isPublic ?? true,
    note: fields.note ?? null,
    metadata: fields.metadata ?? {},
    createdAt,
  };
}

/**
 * Seeds a believable public timeline for every report, derived only from its
 * authored status and timestamps. Internal notes are never seeded.
 */
export function buildSeedEvents(reports) {
  const events = [];

  for (const report of reports) {
    const createdAt = new Date(report.createdAt);
    events.push(
      event(report, 'created', 'created', report.createdAt, {
        actorRole: 'citizen',
        toStatus: 'submitted',
        note: 'Report received',
      }),
    );

    if (report.ai) {
      events.push(
        event(report, 'ai', 'ai_processed', iso(addHours(createdAt, 0.01)), {
          note: `AI ${report.ai.version}: ${report.ai.category} · ${report.ai.priority.band}`,
          metadata: { version: report.ai.version, confidence: report.ai.confidence },
        }),
      );
    }

    if (report.status === 'rejected') {
      events.push(
        event(report, 'rejected', 'status_changed', iso(addHours(createdAt, 48)), {
          actorRole: 'operator',
          fromStatus: 'submitted',
          toStatus: 'rejected',
          note: 'Not accepted: outside municipal scope',
        }),
      );
      continue;
    }

    if (report.status === 'duplicate') {
      events.push(
        event(report, 'duplicate', 'duplicate_confirmed', report.resolvedAt ?? iso(addHours(createdAt, 24)), {
          actorRole: 'operator',
          fromStatus: 'submitted',
          toStatus: 'duplicate',
          note: `Linked to an existing report (${report.duplicateOf})`,
          metadata: { duplicateOf: report.duplicateOf },
        }),
      );
      continue;
    }

    const reachedIndex = STATUS_FLOW.indexOf(report.status);
    if (reachedIndex >= 1) {
      events.push(
        event(report, 'triaged', 'status_changed', iso(addHours(createdAt, 6)), {
          actorRole: 'system',
          fromStatus: 'submitted',
          toStatus: 'triaged',
          note: 'Triaged and checked for duplicates',
        }),
      );
    }
    if (reachedIndex >= 2) {
      events.push(
        event(report, 'assigned', 'status_changed', iso(addHours(createdAt, 24)), {
          actorRole: 'operator',
          fromStatus: 'triaged',
          toStatus: 'assigned',
          note: report.department ? `Assigned to ${report.department}` : 'Assigned to a department',
        }),
      );
    }
    if (reachedIndex >= 3) {
      events.push(
        event(report, 'progress', 'status_changed', iso(addHours(createdAt, 36)), {
          actorRole: 'operator',
          fromStatus: 'assigned',
          toStatus: 'in_progress',
          note: 'Work started on site',
        }),
      );
    }
    if (reachedIndex >= 4) {
      events.push(
        event(report, 'resolved', 'status_changed', report.resolvedAt ?? iso(addHours(createdAt, 72)), {
          actorRole: 'operator',
          fromStatus: 'in_progress',
          toStatus: 'resolved',
          note: 'Work completed and verified',
        }),
      );
    }
    if (reachedIndex >= 5) {
      events.push(
        event(report, 'closed', 'status_changed', iso(addHours(new Date(report.resolvedAt ?? report.updatedAt), 6)), {
          actorRole: 'system',
          fromStatus: 'resolved',
          toStatus: 'closed',
          note: 'Closed after the resolution note was published',
        }),
      );
    }
  }

  return events;
}

/**
 * Candidate pairs surfaced by the pipeline. Low-confidence matches are kept in
 * the per-report analysis but not queued for operator review.
 */
export function buildSeedDuplicatePairs(reports, now = new Date()) {
  const pairs = [];
  const seenPairs = new Set();

  for (const report of reports) {
    if (report.status === 'duplicate' || report.status === 'rejected') continue;

    for (const candidate of report.ai?.duplicates ?? []) {
      if (candidate.level === 'low') continue;
      const pairKey = [report.id, candidate.reportId].sort().join('|');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      pairs.push({
        id: `pair-${[report.id, candidate.reportId].sort().join('-')}`,
        reportId: report.id,
        duplicateOf: candidate.reportId,
        similarity: candidate.score,
        components: candidate.components,
        level: candidate.level,
        status: 'pending',
        reason: null,
        reviewedAt: null,
        createdAt: now.toISOString(),
      });
    }
  }

  return pairs;
}

/**
 * Full seed snapshot. Reports are enriched by the AI pipeline, then candidate
 * pairs are derived from that same analysis so the admin queue starts with real
 * review work rather than hand-written rows.
 */
export function buildSeedData(now = new Date()) {
  const reports = buildSeedReports(now);
  const events = buildSeedEvents(reports);

  // Every seeded report went through the pipeline at seed time. Make that
  // visible on the public timeline rather than pretending AI only runs for new
  // submissions.
  for (const report of reports) {
    events.push(
      event(
        report,
        'ai',
        'ai_processed',
        new Date(new Date(report.createdAt).getTime() + 60_000).toISOString(),
        {
          note: `AI ${report.ai.version}: ${report.ai.category} · ${report.ai.priority.band}`,
          metadata: { version: report.ai.version, confidence: report.ai.confidence },
        },
      ),
    );
  }
  events.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const duplicates = buildSeedDuplicatePairs(reports, now);
  return {
    reports,
    events,
    duplicates,
    meta: {
      seeded: true,
      seededAt: iso(now),
      version: SEED_VERSION,
      reportCount: reports.length,
      duplicateCandidateCount: duplicates.length,
      aiVersion: AI_VERSION,
    },
  };
}

/** Seeds the store once. Safe to call on every repository method. */
export function ensureSeeded() {
  if (!isStorageAvailable()) return false;

  const meta = readJson(STORAGE_KEYS.meta, null);
  if (meta?.seeded && meta.version === SEED_VERSION && meta.aiVersion === AI_VERSION) {
    return false;
  }

  const data = buildSeedData(new Date());
  writeJson(STORAGE_KEYS.reports, data.reports);
  writeJson(STORAGE_KEYS.events, data.events);
  writeJson(STORAGE_KEYS.duplicates, data.duplicates);
  writeJson(STORAGE_KEYS.meta, data.meta);
  return true;
}

/** Human-readable seed metadata for the footer / diagnostics. */
export function readSeedMeta() {
  return readJson(STORAGE_KEYS.meta, null);
}
