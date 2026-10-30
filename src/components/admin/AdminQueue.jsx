import { useState } from 'react';
import { ChevronRight, Inbox, MapPin } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import PriorityBadge from '@/components/reports/PriorityBadge';
import StatusBadge from '@/components/reports/StatusBadge';
import { CATEGORY_MAP, OPEN_STATUSES } from '@/lib/constants';
import { timeAgo } from '@/lib/format';

const SCOPES = [
  { key: 'open', label: 'Open' },
  { key: 'urgent', label: 'P0 + P1' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'all', label: 'All' },
];

function matchesScope(report, scope) {
  if (scope === 'all') return true;
  if (!OPEN_STATUSES.includes(report.status)) return false;
  if (scope === 'urgent') return report.priorityBand === 'P0' || report.priorityBand === 'P1';
  if (scope === 'unassigned') return !report.assignedTo;
  return true;
}

function QueueTable({ rows, onSelect }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="table-base">
        <caption className="sr-only">Open reports sorted by priority</caption>
        <thead>
          <tr>
            <th scope="col">Report</th>
            <th scope="col">Priority</th>
            <th scope="col">Status</th>
            <th scope="col">Owner</th>
            <th scope="col">Age</th>
            <th scope="col">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((report) => (
            <tr key={report.id} className="cursor-pointer" onClick={() => onSelect(report)}>
              <td className="max-w-[24rem]">
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
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-slate-500">
                  <span>{report.referenceCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-sans">
                    {CATEGORY_MAP[report.category]?.short ?? report.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-sans">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {report.locationLabel ?? 'No label'}
                  </span>
                </p>
              </td>
              <td>
                <PriorityBadge band={report.priorityBand} score={report.priorityScore} />
              </td>
              <td>
                <StatusBadge status={report.status} />
              </td>
              <td className="max-w-[12rem]">
                <span className="block truncate text-sm">{report.assignedTo ?? '—'}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {report.department ?? 'No department'}
                </span>
              </td>
              <td className="whitespace-nowrap text-slate-500">{timeAgo(report.createdAt)}</td>
              <td className="text-right">
                <ChevronRight className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueueCards({ rows, onSelect }) {
  return (
    <ul className="divide-y divide-slate-100 md:hidden">
      {rows.map((report) => (
        <li key={report.id}>
          <button
            type="button"
            onClick={() => onSelect(report)}
            className="flex w-full min-h-[44px] flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-navy-50/60"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-5 text-navy-900">
                {report.title ?? report.referenceCode}
              </p>
              <StatusBadge status={report.status} />
            </div>
            <p className="font-mono text-[11px] text-slate-500">
              {report.referenceCode} · {CATEGORY_MAP[report.category]?.short ?? report.category} ·{' '}
              {timeAgo(report.createdAt)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge band={report.priorityBand} score={report.priorityScore} />
              <Badge tone="neutral">{report.department ?? 'No department'}</Badge>
            </div>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{report.locationLabel ?? 'No location label'}</span>
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function AdminQueue({ reports, loading, onSelect }) {
  const [scope, setScope] = useState('open');
  const rows = reports.filter((report) => matchesScope(report, scope));

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Inbox className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Triage queue
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Highest priority first. Open a row to assign, transition or read the factor table.
          </p>
        </div>
        <Badge tone="neutral">{rows.length} reports</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-2.5">
        {SCOPES.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={scope === item.key ? 'primary' : 'ghost'}
            onClick={() => setScope(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          <Skeleton lines={10} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          className="m-4 border-0 bg-transparent"
          icon={Inbox}
          title="Nothing in this view"
          description="Switch the scope or reset the demo data from the footer to restore the 42-report seed."
        />
      ) : (
        <>
          <QueueTable rows={rows} onSelect={onSelect} />
          <QueueCards rows={rows} onSelect={onSelect} />
        </>
      )}
    </section>
  );
}
