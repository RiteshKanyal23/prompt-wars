import { describe, expect, it } from 'vitest';
import { mapReport, toRow } from '@/services/supabase/mappers';

describe('mapReport', () => {
  it('returns null for an empty row', () => {
    expect(mapReport(null)).toBeNull();
    expect(mapReport(undefined)).toBeNull();
  });

  it('renames snake_case columns and drops the originals', () => {
    const report = mapReport({
      id: 'r1',
      reference_code: 'CP-7K2M9Q',
      priority_score: 79,
      priority_band: 'P1',
      location_label: 'Sector 12',
      created_at: '2026-10-30T10:00:00.000Z',
      status: 'submitted',
    });

    expect(report).toMatchObject({
      id: 'r1',
      referenceCode: 'CP-7K2M9Q',
      priorityScore: 79,
      priorityBand: 'P1',
      locationLabel: 'Sector 12',
      createdAt: '2026-10-30T10:00:00.000Z',
      status: 'submitted',
    });
    expect(report).not.toHaveProperty('reference_code');
    expect(report).not.toHaveProperty('priority_score');
  });

  it('keeps unmapped fields untouched', () => {
    expect(mapReport({ id: 'r1', title: 'Water', ai: { version: 'rules-v1' } })).toEqual({
      id: 'r1',
      title: 'Water',
      ai: { version: 'rules-v1' },
    });
  });
});

describe('toRow', () => {
  it('renames domain keys to columns and skips undefined values', () => {
    const row = toRow({
      referenceCode: 'CP-7K2M9Q',
      priorityBand: 'P1',
      title: 'Water',
      imageUrl: undefined,
    });

    expect(row).toEqual({
      reference_code: 'CP-7K2M9Q',
      priority_band: 'P1',
      title: 'Water',
    });
  });

  it('round-trips a mapped report', () => {
    const domain = {
      referenceCode: 'CP-7K2M9Q',
      assignedTo: 'Drainage Cell',
      slaDueAt: '2026-10-31T10:00:00.000Z',
      status: 'assigned',
    };
    expect(mapReport(toRow(domain))).toEqual(domain);
  });

  it('defaults to an empty row', () => {
    expect(toRow()).toEqual({});
  });
});
