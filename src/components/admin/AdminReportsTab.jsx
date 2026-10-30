import { useMemo, useState } from 'react';
import { Download, Search, Table2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import PriorityBadge from '@/components/reports/PriorityBadge';
import StatusBadge from '@/components/reports/StatusBadge';
import { useToast } from '@/hooks/useToast';
import { CATEGORY_MAP } from '@/lib/constants';
import { downloadCsv, toCsv } from '@/lib/csv';
import { formatDateTime, timeAgo } from '@/lib/format';

const CSV_COLUMNS = [
  { key: 'referenceCode', label: 'Code' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'categoryLabel', label: 'Category' },
  { key: 'priorityBand', label: 'Priority band', value: (row) => row.priorityBand ?? 'Unscored' },
  { key: 'priorityScore', label: 'Priority score', value: (row) => row.priorityScore ?? '' },
  { key: 'status', label: 'Status' },
  { key: 'department', label: 'Department' },
  { key: 'assignedTo', label: 'Assigned to' },
  { key: 'locationLabel', label: 'Location' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'createdAt', label: 'Created', value: (row) => formatDateTime(row.createdAt) },
  { key: 'resolvedAt', label: 'Resolved', value: (row) => formatDateTime(row.resolvedAt) },
];

export default function AdminReportsTab({ reports, loading, onSelect }) {
  const [query, setQuery] = useState('');
  const { push } = useToast();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return reports;
    return reports.filter((report) =>
      `${report.referenceCode} ${report.title ?? ''} ${report.description} ${
        report.locationLabel ?? ''
      } ${report.department ?? ''}`
        .toLowerCase()
        .includes(needle),
    );
  }, [reports, query]);

  function handleExport() {
    const rows = filtered.map((report) => ({
      ...report,
      categoryLabel: CATEGORY_MAP[report.category]?.label ?? report.category,
    }));
    const csv = toCsv(CSV_COLUMNS, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    const ok = downloadCsv(`civicpulse-reports-${stamp}.csv`, csv);
    push({
      tone: ok ? 'success' : 'warning',
      title: ok ? 'CSV downloaded' : 'CSV export needs a browser',
      description: `${filtered.length} rows · formula injection guarded.`,
    });
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Table2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
            All reports
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Search the full corpus and export the filtered set. Cells starting with =, +, - or @
            are prefixed so spreadsheets cannot execute them.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      <div className="border-b border-slate-100 px-4 py-3">
        <label htmlFor="admin-report-search" className="label">
          Search
        </label>
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="admin-report-search"
            className="input pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Code, title, department, location…"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          <Skeleton lines={10} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="m-4 border-0 bg-transparent"
          icon={Table2}
          title="No reports match this search"
          description="Clear the search to see the full corpus."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="table-base">
              <caption className="sr-only">Reports matching the current search</caption>
              <thead>
                <tr>
                  <th scope="col">Report</th>
                  <th scope="col">Category</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Department</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((report) => (
                  <tr key={report.id} className="cursor-pointer" onClick={() => onSelect(report)}>
                    <td className="max-w-[22rem]">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(report);
                        }}
                        className="text-left font-semibold text-navy-900 hover:text-teal-700"
                      >
                        {report.title ?? report.referenceCode}
                      </button>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {report.referenceCode}
                      </p>
                    </td>
                    <td>{CATEGORY_MAP[report.category]?.short ?? report.category}</td>
                    <td>
                      <PriorityBadge band={report.priorityBand} score={report.priorityScore} />
                    </td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="max-w-[12rem]">
                      <span className="block truncate">{report.department ?? '—'}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {report.assignedTo ?? 'Unassigned'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">
                      {timeAgo(report.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((report) => (
              <li key={report.id}>
                <button
                  type="button"
                  onClick={() => onSelect(report)}
                  className="flex w-full min-h-[44px] flex-col gap-2 px-4 py-3.5 text-left hover:bg-navy-50/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold leading-5 text-navy-900">
                      {report.title ?? report.referenceCode}
                    </p>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="font-mono text-[11px] text-slate-500">
                    {report.referenceCode} · {CATEGORY_MAP[report.category]?.short ?? report.category}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge band={report.priorityBand} score={report.priorityScore} />
                    <Badge tone="neutral">{report.department ?? 'No department'}</Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div
            role="status"
            aria-live="polite"
            className="border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500"
          >
            {filtered.length} of {reports.length} reports
          </div>
        </>
      )}
    </section>
  );
}
