import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import PriorityBadge from '@/components/reports/PriorityBadge';
import StatusBadge from '@/components/reports/StatusBadge';
import { CATEGORY_MAP } from '@/lib/constants';
import { formatNumber, timeAgo } from '@/lib/format';

/**
 * The table alternative to the map. Desktop gets a scrollable table, mobile
 * gets stacked cards; both read from the same filtered array.
 */
export default function DashboardReportTable({
  reports = [],
  loading = false,
  activeFilters = 0,
  onClearFilters,
}) {
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Reports in this filter</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            The list alternative to the map. Every row opens its analysis.
          </p>
        </div>
        <Badge tone="neutral">{formatNumber(reports.length)} rows</Badge>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          <Skeleton lines={8} />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          className="m-5 border-0 bg-transparent"
          icon={MapPin}
          title="No reports match these filters"
          description="Clear a filter to widen the set, or reset the demo data from the footer to restore the 42-report seed."
          action={
            activeFilters > 0 ? (
              <Button variant="ghost" onClick={onClearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <div className="max-h-[28rem] overflow-y-auto">
              <table className="table-base">
                <caption className="sr-only">Reports matching the current dashboard filters</caption>
                <thead className="sticky top-0 z-10 bg-white">
                  <tr>
                    <th scope="col">Report</th>
                    <th scope="col">Category</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Status</th>
                    <th scope="col">Location</th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="max-w-[22rem]">
                        <Link
                          to={`/analysis/${report.id}`}
                          className="font-semibold text-navy-900 hover:text-teal-700"
                        >
                          {report.title ?? report.referenceCode}
                        </Link>
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
                      <td className="max-w-[14rem]">
                        <span className="block truncate">{report.locationLabel ?? '—'}</span>
                      </td>
                      <td className="whitespace-nowrap text-slate-500">{timeAgo(report.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="divide-y divide-slate-100 sm:hidden">
            {reports.map((report) => (
              <li key={report.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/analysis/${report.id}`}
                    className="text-sm font-semibold text-navy-900 hover:text-teal-700"
                  >
                    {report.title ?? report.referenceCode}
                  </Link>
                  <StatusBadge status={report.status} />
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  {report.referenceCode} · {CATEGORY_MAP[report.category]?.short ?? report.category}
                </p>
                <div className="mt-2">
                  <PriorityBadge band={report.priorityBand} score={report.priorityScore} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{report.locationLabel ?? 'No location label'}</span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
