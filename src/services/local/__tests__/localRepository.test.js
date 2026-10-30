import { beforeEach, describe, expect, it } from 'vitest';
import { localRepository } from '@/services/local/localRepository';
import { STORAGE_KEYS } from '@/services/local/storage';
import { countBy } from '@/lib/reportStats';

const REQUIRED_CATEGORIES = {
  water: 11,
  roads: 9,
  waste: 8,
  electricity: 6,
  sanitation: 4,
  public_safety: 3,
  other: 1,
};

const REQUIRED_STATUSES = {
  submitted: 8,
  triaged: 7,
  assigned: 6,
  in_progress: 6,
  resolved: 9,
  closed: 2,
  rejected: 2,
  duplicate: 2,
};

class MemoryStorage {
  #items = new Map();

  get length() {
    return this.#items.size;
  }

  key(index) {
    return [...this.#items.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null;
  }

  setItem(key, value) {
    this.#items.set(key, String(value));
  }

  removeItem(key) {
    this.#items.delete(key);
  }

  clear() {
    this.#items.clear();
  }
}

const storage = new MemoryStorage();

// The repository only touches `window.localStorage`, so a tiny stand-in is
// enough to exercise the real storage + seed code in Node.
globalThis.window = {
  localStorage: storage,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
};
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type) {
      this.type = type;
    }
  };
}

beforeEach(() => {
  storage.clear();
});

describe('localRepository seed', () => {
  it('seeds 42 reports into the documented storage key', async () => {
    const reports = await localRepository.listReports();
    const stored = JSON.parse(storage.getItem(STORAGE_KEYS.reports));

    expect(reports).toHaveLength(42);
    expect(stored).toHaveLength(42);
    expect(STORAGE_KEYS.reports).toBe('civicpulse:v1:reports');
  });

  it('matches the frozen category and status composition', async () => {
    const reports = await localRepository.listReports();

    expect(countBy(reports, (report) => report.category)).toEqual(REQUIRED_CATEGORIES);
    expect(countBy(reports, (report) => report.status)).toEqual(REQUIRED_STATUSES);
  });

  it('enriches every seeded report with real rules-v1 output', async () => {
    const reports = await localRepository.listReports();

    for (const report of reports) {
      expect(report.ai).not.toBeNull();
      expect(report.ai.version).toBe('rules-v1');
      expect(report.priorityScore).toBeGreaterThanOrEqual(0);
      expect(report.priorityScore).toBeLessThanOrEqual(100);
      expect(['P0', 'P1', 'P2', 'P3']).toContain(report.priorityBand);
    }
  });

  it('sorts by priority desc, then newest first', async () => {
    const reports = await localRepository.listReports();

    for (let index = 1; index < reports.length; index += 1) {
      const previous = reports[index - 1];
      const current = reports[index];

      if (previous.priorityScore !== current.priorityScore) {
        expect(previous.priorityScore).toBeGreaterThan(current.priorityScore);
      } else {
        expect(new Date(previous.createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(current.createdAt).getTime(),
        );
      }
    }
  });

  it('resets back to the seed after a mutation', async () => {
    await localRepository.createReport({
      description: 'A new test report that should disappear after a reset.',
      category: 'waste',
      latitude: 12.9716,
      longitude: 77.5946,
    });
    expect(await localRepository.listReports()).toHaveLength(43);

    await localRepository.reset();
    expect(await localRepository.listReports()).toHaveLength(42);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.reports))).toHaveLength(42);
  });
});

describe('localRepository queries', () => {
  it('looks up a report by code case-insensitively', async () => {
    const report = await localRepository.getReportByCode(' cp-7k2m9q ');

    expect(report).not.toBeNull();
    expect(report.referenceCode).toBe('CP-7K2M9Q');
  });

  it('returns null for an unknown id or code instead of throwing', async () => {
    expect(await localRepository.getReportById('missing')).toBeNull();
    expect(await localRepository.getReportByCode('CP-ZZZZZZ')).toBeNull();
  });

  it('filters by category, status and free text', async () => {
    expect(await localRepository.listReports({ category: 'water' })).toHaveLength(11);
    expect(await localRepository.listReports({ status: 'submitted' })).toHaveLength(8);
    expect(await localRepository.listReports({ search: 'school' })).not.toHaveLength(0);
  });

  it('lists events in ascending time order', async () => {
    const report = await localRepository.getReportByCode('CP-7K2M9Q');
    const events = await localRepository.listEvents(report.id);

    expect(events.length).toBeGreaterThan(0);
    for (let index = 1; index < events.length; index += 1) {
      expect(new Date(events[index - 1].createdAt).getTime()).toBeLessThanOrEqual(
        new Date(events[index].createdAt).getTime(),
      );
    }
  });
});

describe('localRepository mutations', () => {
  it('creates a report with a CP-XXXXXX code and a created event', async () => {
    const report = await localRepository.createReport({
      title: 'Test pothole',
      description: 'A pothole large enough to damage a two-wheeler on the test road.',
      category: 'roads',
      locationLabel: 'Test road',
      latitude: 12.9716,
      longitude: 77.5946,
    });

    expect(report.referenceCode).toMatch(/^CP-[A-HJ-NP-Z2-9]{6}$/);
    expect(report.status).toBe('submitted');
    expect(await localRepository.getReportByCode(report.referenceCode)).not.toBeNull();

    const events = await localRepository.listEvents(report.id);
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining(['created', 'ai_processed']),
    );
  });

  it('never exposes internal events through the public query', async () => {
    const report = await localRepository.getReportByCode('CP-7K2M9Q');
    await localRepository.updateReport(
      report.id,
      {},
      { type: 'note', isPublic: false, note: 'Internal operator note' },
    );

    const publicEvents = await localRepository.listEvents(report.id, { publicOnly: true });
    const allEvents = await localRepository.listEvents(report.id);

    expect(allEvents.some((event) => event.note === 'Internal operator note')).toBe(true);
    expect(publicEvents.some((event) => event.note === 'Internal operator note')).toBe(false);
  });

  it('appends a public event when a status changes', async () => {
    const report = await localRepository.getReportByCode('CP-7K2M9Q');
    const updated = await localRepository.updateReport(
      report.id,
      { status: 'assigned' },
      { type: 'status_changed', fromStatus: report.status, toStatus: 'assigned', isPublic: true },
    );

    expect(updated.status).toBe('assigned');
    const events = await localRepository.listEvents(report.id, { publicOnly: true });
    expect(events.some((event) => event.toStatus === 'assigned')).toBe(true);
  });

  it('rejects an invalid status transition without touching the report', async () => {
    const [resolved] = await localRepository.listReports({ status: 'resolved' });

    await expect(
      localRepository.updateReport(
        resolved.id,
        { status: 'assigned' },
        { type: 'status_changed', isPublic: true },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });

    const after = await localRepository.getReportById(resolved.id);
    expect(after.status).toBe('resolved');
  });

  it('confirms a duplicate on the child and records an event on both reports', async () => {
    const pairs = await localRepository.listDuplicatePairs();
    const pair = pairs.find((item) => item.status === 'pending');

    expect(pair).toBeDefined();
    const childBefore = await localRepository.getReportById(pair.reportId);
    const parentBefore = await localRepository.getReportById(pair.duplicateOf);

    await localRepository.reviewDuplicate(pair.id, 'confirmed', 'Same blocked drain');

    const child = await localRepository.getReportById(pair.reportId);
    expect(child.status).toBe('duplicate');
    expect(child.duplicateOf).toBe(pair.duplicateOf);
    expect(child.duplicateConfirmed).toBe(true);

    const childEvents = await localRepository.listEvents(pair.reportId, { publicOnly: true });
    expect(childEvents.some((event) => event.type === 'duplicate_confirmed')).toBe(true);

    const parentEvents = await localRepository.listEvents(pair.duplicateOf, { publicOnly: true });
    expect(parentEvents.some((event) => event.type === 'duplicate_confirmed')).toBe(true);
    expect(parentBefore.status).toBe(
      (await localRepository.getReportById(pair.duplicateOf)).status,
    );
    expect(childBefore.status).not.toBe('duplicate');
  });

  it('rejecting a duplicate leaves both reports open', async () => {
    const pairs = await localRepository.listDuplicatePairs();
    const pair = pairs.find((item) => item.status === 'pending');
    const childBefore = await localRepository.getReportById(pair.reportId);
    const parentBefore = await localRepository.getReportById(pair.duplicateOf);

    await localRepository.reviewDuplicate(pair.id, 'rejected', 'Different drains');

    const child = await localRepository.getReportById(pair.reportId);
    const parent = await localRepository.getReportById(pair.duplicateOf);
    expect(child.status).toBe(childBefore.status);
    expect(parent.status).toBe(parentBefore.status);
    expect(child.duplicateOf ?? null).toBe(childBefore.duplicateOf ?? null);

    const reviewed = await localRepository.listDuplicatePairs();
    expect(reviewed.find((item) => item.id === pair.id).status).toBe('rejected');
  });
});

describe('localRepository recent tracking codes', () => {
  it('normalises, de-duplicates and keeps the five newest codes', async () => {
    await localRepository.rememberCode('cp-aaaaaa');
    await localRepository.rememberCode('CP-BBBBBB');
    await localRepository.rememberCode('cp-aaaaaa');

    const codes = await localRepository.listRecentCodes();
    expect(codes.map((entry) => entry.code)).toEqual(['CP-AAAAAA', 'CP-BBBBBB']);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.recentCodes))).toHaveLength(2);

    for (const suffix of ['CCCCCC', 'DDDDDD', 'EEEEEE', 'FFFFFF']) {
      await localRepository.rememberCode(`CP-${suffix}`);
    }

    const capped = await localRepository.listRecentCodes();
    expect(capped).toHaveLength(5);
    expect(capped[0].code).toBe('CP-FFFFFF');
    expect(capped.map((entry) => entry.code)).not.toContain('CP-BBBBBB');
  });

  it('clears recent codes without touching stored reports', async () => {
    await localRepository.rememberCode('CP-AAAAAA');
    await localRepository.clearRecentCodes();

    expect(await localRepository.listRecentCodes()).toEqual([]);
    expect(storage.getItem(STORAGE_KEYS.recentCodes)).toBeNull();
    expect(await localRepository.listReports()).toHaveLength(42);
  });
});
