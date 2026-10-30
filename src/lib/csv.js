const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\n\r]/;

/**
 * CSV cell escaping that also neutralises spreadsheet formula injection.
 *
 * A citizen-supplied title like `=HYPERLINK("http://evil")` would run in Excel
 * if exported verbatim. Prefixing a single quote keeps the text visible while
 * forcing the spreadsheet to treat it as a string. Quotes, commas and newlines
 * are handled with standard RFC 4180 double-quoting.
 */
export function escapeCsvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  const guarded = FORMULA_PREFIX.test(text) ? `'${text}` : text;
  return NEEDS_QUOTES.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/**
 * @param {Array<{key:string,label:string,value?:(row:object)=>unknown}>} columns
 * @param {object[]} rows
 */
export function toCsv(columns, rows) {
  const header = columns.map((column) => escapeCsvCell(column.label ?? column.key)).join(',');
  const body = rows.map((row) =>
    columns
      .map((column) =>
        escapeCsvCell(typeof column.value === 'function' ? column.value(row) : row[column.key]),
      )
      .join(','),
  );

  return [header, ...body].join('\r\n');
}

/** Browser-only download. Kept out of components so the encoding stays testable. */
export function downloadCsv(filename, csv) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
