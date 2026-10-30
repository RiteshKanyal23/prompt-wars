import { describe, expect, it } from 'vitest';
import { escapeCsvCell, toCsv } from '@/lib/csv';

describe('escapeCsvCell', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(escapeCsvCell('Sector 12, 4th Cross')).toBe('"Sector 12, 4th Cross"');
    expect(escapeCsvCell('He said "fixed"')).toBe('"He said ""fixed"""');
    expect(escapeCsvCell('line one\nline two')).toBe('"line one\nline two"');
  });

  it('neutralises spreadsheet formula injection', () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil")')).toBe(
      '"\'=HYPERLINK(""http://evil"")"',
    );
    expect(escapeCsvCell('+1-800')).toBe("'+1-800");
    expect(escapeCsvCell('-2+3')).toBe("'-2+3");
    expect(escapeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('leaves ordinary text and null untouched', () => {
    expect(escapeCsvCell('Blocked drain')).toBe('Blocked drain');
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });
});

describe('toCsv', () => {
  it('builds a header and rows with custom accessors', () => {
    const csv = toCsv(
      [
        { key: 'code', label: 'Code' },
        { key: 'title', label: 'Title' },
        { key: 'band', label: 'Band', value: (row) => row.priorityBand ?? 'Unscored' },
      ],
      [
        { code: 'CP-ABC234', title: 'Drain, Sector 12', priorityBand: 'P1' },
        { code: 'CP-DEF567', title: '=cmd', priorityBand: null },
      ],
    );

    expect(csv.split('\r\n')).toEqual([
      'Code,Title,Band',
      'CP-ABC234,"Drain, Sector 12",P1',
      "CP-DEF567,'=cmd,Unscored",
    ]);
  });
});
