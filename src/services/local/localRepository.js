import { OPEN_STATUSES } from '@/lib/constants';
import { clone, nowIso } from '@/lib/format';
import { createReferenceCode, normalizeReferenceCode } from '@/lib/referenceCode';
import { assertTransition } from '@/lib/workflow';
import { analyzeReport } from '@/services/ai/pipeline';
import { computeClusters } from '@/services/ai/clusters';
import { buildSeedData, ensureSeeded } from './seed';
import {
  STORAGE_KEYS,
  clearStorage,
  notifyDataChanged,
  readJson,
  removeKey,
  writeJson,
} from './storage';

const read = (key, fallback) => readJson(key, fallback);
const write = (key, value) => writeJson(key, value);

const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function uniqueReferenceCode(existingReports) {
  const taken = new Set(existingReports.map((report) => report.referenceCode));
  let code = createReferenceCode();
  for (let attempt = 0; attempt < 20 && taken.has(code); attempt += 1) {
    code = createReferenceCode();
  }
  return code;
}

function eventFor(report, suffix, type, createdAt, fields = {}) {
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
 * Writes a fresh, fully analysed seed snapshot. `buildSeedData` owns the
 * two-pass AI enrichment, so this repository never re-runs the pipeline or
 * drifts from the shared seed contract.
 */
function seedStore(now = new Date()) {
  const data = buildSeedData(now);
  write(STORAGE_KEYS.reports, data.reports);
  write(STORAGE_KEYS.events, data.events);
  write(STORAGE_KEYS.duplicates, data.duplicates);
  write(STORAGE_KEYS.meta, data.meta);
  return data;
}

function readReports() {
  ensureSeeded();
  return read(STORAGE_KEYS.reports, []);
}

function sortReports(reports) {
  return reports.sort(
    (a, b) =>
      (b.priorityScore ?? -1) - (a.priorityScore ?? -1) ||
      new Date(b.createdAt) - new Date(a.createdAt),
  );
}

function matchesSearch(report, query) {
  const haystack =
    `${report.referenceCode} ${report.title ?? ''} ${report.description} ${report.locationLabel ?? ''}`.toLowerCase();
  return haystack.includes(query);
}

function appendEvent(event) {
  const events = read(STORAGE_KEYS.events, []);
  events.push(event);
  write(STORAGE_KEYS.events, events);
}

function readRecentCodes() {
  const stored = read(STORAGE_KEYS.recentCodes, []);
  return Array.isArray(stored) ? stored : [];
}

export const localRepository = {
  mode: 'local',

  async listReports(filters = {}) {
    let reports = readReports().slice();

    if (filters.status) reports = reports.filter((report) => report.status === filters.status);
    if (filters.openOnly) {
      reports = reports.filter((report) => OPEN_STATUSES.includes(report.status));
    }
    if (filters.category) {
      reports = reports.filter((report) => report.category === filters.category);
    }
    if (filters.band) reports = reports.filter((report) => report.priorityBand === filters.band);
    if (filters.clusterKey) {
      reports = reports.filter((report) => report.clusterKey === filters.clusterKey);
    }
    if (filters.search) {
      const query = String(filters.search).trim().toLowerCase();
      if (query) reports = reports.filter((report) => matchesSearch(report, query));
    }

    const limit = Number(filters.limit ?? 500);
    return clone(sortReports(reports).slice(0, Number.isFinite(limit) ? limit : 500));
  },

  async getReportById(id) {
    ensureSeeded();
    return clone(read(STORAGE_KEYS.reports, []).find((report) => report.id === id) ?? null);
  },

  async getReportByCode(code) {
    ensureSeeded();
    const target = normalizeReferenceCode(code);
    return clone(
      read(STORAGE_KEYS.reports, []).find(
        (report) => report.referenceCode.toUpperCase() === target,
      ) ?? null,
    );
  },

  async listEvents(reportId, { publicOnly = false } = {}) {
    ensureSeeded();
    return clone(
      read(STORAGE_KEYS.events, [])
        .filter((event) => event.reportId === reportId && (!publicOnly || event.isPublic))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    );
  },

  async createReport(input) {
    const reports = readReports();
    const now = new Date();
    const id = newId();
    const referenceCode = uniqueReferenceCode(reports);

    const base = {
      id,
      referenceCode,
      citizenId: input.citizenId ?? null,
      title: input.title?.trim() || null,
      description: String(input.description ?? '').trim(),
      category: input.category === 'auto' || !input.category ? 'other' : input.category,
      locationLabel: input.locationLabel?.trim() || null,
      latitude: Number(input.latitude),
      longitude: Number(input.longitude),
      imageUrl: input.imageUrl ?? null,
      status: 'submitted',
      priorityScore: null,
      priorityBand: null,
      department: null,
      assignedTo: null,
      slaDueAt: null,
      duplicateOf: null,
      duplicateConfirmed: false,
      clusterKey: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      resolvedAt: null,
    };

    const ai = analyzeReport(base, reports, { now });
    const report = {
      ...base,
      category:
        input.category === 'auto' || !input.category ? ai.category : base.category,
      priorityScore: ai.priority.score,
      priorityBand: ai.priority.band,
      clusterKey: ai.cluster?.key ?? null,
      ai,
    };

    reports.push(report);
    write(STORAGE_KEYS.reports, reports);

    appendEvent(
      eventFor(report, 'created', 'created', now.toISOString(), {
        actorRole: 'citizen',
        toStatus: 'submitted',
        note: 'Report received',
      }),
    );
    appendEvent(
      eventFor(report, 'ai', 'ai_processed', now.toISOString(), {
        note: `AI ${ai.version}: ${ai.category} · ${ai.priority.band}`,
        metadata: {
          version: ai.version,
          confidence: ai.confidence,
          ms: ai.processingMs,
        },
      }),
    );

    const duplicates = read(STORAGE_KEYS.duplicates, []);
    for (const candidate of ai.duplicates) {
      if (candidate.level === 'low') continue;
      duplicates.push({
        id: newId(),
        reportId: id,
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
    write(STORAGE_KEYS.duplicates, duplicates);

    notifyDataChanged();
    return clone(report);
  },

  async updateReport(id, patch, event = null) {
    const reports = readReports();
    const index = reports.findIndex((report) => report.id === id);
    if (index === -1) throw new Error('Report not found');

    const previous = reports[index];
    if (patch.status && patch.status !== previous.status) {
      assertTransition(previous.status, patch.status);
    }
    const next = { ...previous, ...patch, updatedAt: nowIso() };
    if (patch.status === 'resolved') next.resolvedAt = nowIso();
    reports[index] = next;
    write(STORAGE_KEYS.reports, reports);

    if (event) {
      appendEvent({
        id: newId(),
        reportId: id,
        actorId: event.actorId ?? null,
        type: event.type ?? 'status_changed',
        actorRole: event.actorRole ?? 'operator',
        isPublic: event.isPublic ?? true,
        note: event.note ?? null,
        createdAt: nowIso(),
        fromStatus: event.fromStatus ?? previous.status,
        toStatus: event.toStatus ?? next.status,
        metadata: event.metadata ?? {},
      });
    }

    notifyDataChanged();
    return clone(next);
  },

  async listDuplicatePairs() {
    ensureSeeded();
    return clone(
      read(STORAGE_KEYS.duplicates, []).sort((a, b) => {
        const order = { pending: 0, confirmed: 1, rejected: 2 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9) ||
          new Date(b.createdAt) - new Date(a.createdAt);
      }),
    );
  },

  async reviewDuplicate(pairId, decision, reason = '') {
    const duplicates = read(STORAGE_KEYS.duplicates, []);
    const pair = duplicates.find((item) => item.id === pairId);
    if (!pair) throw new Error('Duplicate pair not found');

    pair.status = decision;
    pair.reason = reason;
    pair.reviewedAt = nowIso();
    write(STORAGE_KEYS.duplicates, duplicates);

    if (decision === 'confirmed') {
      await localRepository.updateReport(
        pair.reportId,
        {
          status: 'duplicate',
          duplicateOf: pair.duplicateOf,
          duplicateConfirmed: true,
        },
        {
          type: 'duplicate_confirmed',
          note: reason || 'Linked to an existing report',
          isPublic: true,
        },
      );

      const parent = read(STORAGE_KEYS.reports, []).find(
        (report) => report.id === pair.duplicateOf,
      );
      if (parent) {
        await localRepository.updateReport(parent.id, {}, {
          type: 'duplicate_confirmed',
          note: 'Another report was linked to this issue',
          isPublic: true,
          metadata: { duplicateReportId: pair.reportId },
        });
      }
    }

    notifyDataChanged();
    return clone(pair);
  },

  async listClusters() {
    return clone(computeClusters(readReports()));
  },

  async listRecentCodes() {
    return clone(readRecentCodes());
  },

  async rememberCode(code) {
    const normalized = normalizeReferenceCode(code);
    if (!normalized) return clone(readRecentCodes());

    const existing = readRecentCodes().filter((entry) => entry.code !== normalized);
    const next = [{ code: normalized, createdAt: nowIso() }, ...existing].slice(0, 5);
    write(STORAGE_KEYS.recentCodes, next);
    notifyDataChanged();
    return clone(next);
  },

  async clearRecentCodes() {
    removeKey(STORAGE_KEYS.recentCodes);
    notifyDataChanged();
  },

  async reset() {
    clearStorage();
    seedStore(new Date());
    notifyDataChanged();
  },
};
