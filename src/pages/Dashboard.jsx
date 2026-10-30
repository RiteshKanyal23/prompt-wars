import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Filter, MapPin, Search, X } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import HonestyNote from '@/components/ui/HonestyNote';
import Skeleton from '@/components/ui/Skeleton';
import PriorityBadge from '@/components/reports/PriorityBadge';
import StatusBadge from '@/components/reports/StatusBadge';
import ReportMap from '@/components/map/ReportMap';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import FixFirstList from '@/components/dashboard/FixFirstList';
import HotspotCard from '@/components/dashboard/HotspotCard';
import ActionBriefModal from '@/components/dashboard/ActionBriefModal';
import { useReports } from '@/hooks/useReports';
import { computeClusters } from '@/services/ai/clusters';
import {
  CATEGORY_MAP,
  CATEGORIES,
  OPEN_STATUSES,
  PRIORITY_ORDER,
  STATUS_KEYS,
  STATUS_META,
} from '@/lib/constants';
import { formatNumber, formatPercent, timeAgo } from '@/lib/format';
import { summarizeReports, filterReports } from '@/lib/reportStats';

const KPI_HINTS = {
  'Total reports': 'Reports matching the filters',
  Open: 'Received to in progress',
  'P0 + P1': 'Critical and high bands',
  'Resolved (30 d)': 'Resolved or closed',
  'Duplicate rate': 'Linked duplicates',
};

function KpiCard({ label, value, loading }) {
  return (
    <Card className="card-pad">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-16" />
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900 sm:text-3xl">{value}</p>
      )}
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{KPI_HINTS[label]}</p>
    </Card>
  );
}

function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </div>
  );
}

export default function Dashboard() {
  const { data: reports, loading, error, reload } = useReports();
  const [params, setParams] = useSearchParams();
  const [briefCluster, setBriefCluster] = useState(null);

  const category = params.get('category') ?? '';
  const status = params.get('status') ?? '';
  const band = params.get('band') ?? '';
  const query = params.get('q') ?? '';

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  function clearFilters() {
    setParams(new URLSearchParams(), { replace: true });
  }

  const filtered = useMemo(
    () => filterReports(reports, { category, status, band, query }),
    [reports, category, status, band, query],
  );

  const summary = summarizeReports(filtered);
  const openReports = filtered.filter((report) => OPEN_STATUSES.includes(report.status));

  // Clusters are recomputed from the filtered array, not looked up from the
  // whole corpus: a hotspot card must never claim reports the filters hide.
  const visibleClusters = useMemo(() => computeClusters(filtered), [filtered]);

  const activeFilters = [category, status, band, query].filter(Boolean).length;

  const kpis = [
    { label: 'Total reports', value: formatNumber(summary.total) },
    { label: 'Open', value: formatNumber(summary.open) },
    { label: 'P0 + P1', value: summary.scored ? formatNumber(summary.p0p1) : '—' },
    { label: 'Resolved (30 d)', value: formatNumber(summary.resolved30) },
    { label: 'Duplicate rate', value: formatPercent(summary.duplicateRate, 1) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reveal"
        title="Dashboard"
        description="One filtered corpus, counted four ways: KPIs, map, priority ranking and hotspots. Every widget derives from the same array."
        actions={
          <>
            <Badge tone="info" dot>
              Seeded local data
            </Badge>
            <Link to="/admin" className="btn btn-ghost">
              Open admin
            </Link>
          </>
        }
      />

      <Container className="py-8 sm:py-10">
        {error ? (
          <Card className="card-pad">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-navy-900">The demo data could not be loaded.</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {error.message || 'Local storage may be unavailable in this browser.'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={reload}>
                Try again
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card padded>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  Filters
                </h2>
                <div className="flex items-center gap-2">
                  <Badge tone={activeFilters > 0 ? 'teal' : 'neutral'}>
                    {activeFilters > 0 ? `${activeFilters} active` : 'No filters'}
                  </Badge>
                  {activeFilters > 0 ? (
                    <Button size="sm" variant="ghost" onClick={clearFilters}>
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div>
                  <label htmlFor="dashboard-search" className="label">
                    Search
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="dashboard-search"
                      className="input pl-9"
                      placeholder="Code, title, location…"
                      value={query}
                      onChange={(event) => setFilter('q', event.target.value)}
                    />
                  </div>
                </div>

                <FilterSelect
                  id="filter-category"
                  label="Category"
                  value={category}
                  onChange={(value) => setFilter('category', value)}
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  id="filter-status"
                  label="Status"
                  value={status}
                  onChange={(value) => setFilter('status', value)}
                >
                  <option value="">All statuses</option>
                  {STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {STATUS_META[key].label}
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  id="filter-band"
                  label="Priority"
                  value={band}
                  onChange={(value) => setFilter('band', value)}
                >
                  <option value="">All bands</option>
                  {PRIORITY_ORDER.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </FilterSelect>
              </div>
            </Card>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} loading={loading} />
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card padded>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">Map</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Pins follow the filtered set; dashed circles are hotspots.
                    </p>
                  </div>
                  <Badge tone="neutral">{formatNumber(filtered.length)} pins</Badge>
                </div>

                <div className="mt-4">
                  {loading ? (
                    <Skeleton className="h-[380px] w-full" />
                  ) : (
                    <ReportMap reports={filtered} clusters={visibleClusters} height={380} />
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  If tiles are blocked, the ranked list below and the report table at the bottom
                  carry the same information without a map.
                </p>
              </Card>

              <Card padded>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">Hotspots</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Grid clusters with 3+ reports in 30 days, counted from the filtered set.
                    </p>
                  </div>
                  <Badge tone="teal">{visibleClusters.length}</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {loading ? (
                    <Skeleton lines={6} />
                  ) : visibleClusters.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm leading-6 text-slate-500">
                      No hotspot matches the current filters. A hotspot needs at least three reports
                      in the same 0.003° grid cell within 30 days.
                    </p>
                  ) : (
                    visibleClusters.map((cluster) => (
                      <HotspotCard key={cluster.id} cluster={cluster} onBrief={setBriefCluster} />
                    ))
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Hotspot scores combine cluster size, category spread and average priority.
                </p>
              </Card>
            </div>

            <Card padded className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">Fix first</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Open reports in this filter, highest priority first. Expand a row to see the
                    arithmetic.
                  </p>
                </div>
                <Badge tone="neutral">{formatNumber(openReports.length)} open</Badge>
              </div>

              <div className="mt-4">
                {loading ? (
                  <Skeleton lines={6} />
                ) : (
                  <FixFirstList reports={openReports} limit={6} />
                )}
              </div>
            </Card>

            <Card padded className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">Patterns</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Category mix, priority bands and the last 14 days — all from the filtered set.
                  </p>
                </div>
                <Badge tone="neutral">No animation</Badge>
              </div>
              <div className="mt-5">
                {loading ? <Skeleton lines={8} /> : <DashboardCharts reports={filtered} />}
              </div>
            </Card>

            <Card className="mt-6 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Reports in this filter</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    The list alternative to the map. Every row opens its analysis.
                  </p>
                </div>
                <Badge tone="neutral">{formatNumber(filtered.length)} rows</Badge>
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  <Skeleton lines={8} />
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  className="m-5 border-0 bg-transparent"
                  icon={MapPin}
                  title="No reports match these filters"
                  description="Clear a filter to widen the set, or reset the demo data from the footer to restore the 42-report seed."
                  action={
                    activeFilters > 0 ? (
                      <Button variant="ghost" onClick={clearFilters}>
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
                          {filtered.map((report) => (
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
                                <PriorityBadge
                                  band={report.priorityBand}
                                  score={report.priorityScore}
                                />
                              </td>
                              <td>
                                <StatusBadge status={report.status} />
                              </td>
                              <td className="max-w-[14rem]">
                                <span className="block truncate">{report.locationLabel ?? '—'}</span>
                              </td>
                              <td className="whitespace-nowrap text-slate-500">
                                {timeAgo(report.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <ul className="divide-y divide-slate-100 sm:hidden">
                    {filtered.map((report) => (
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

            <HonestyNote className="mt-6" title="Synthetic corpus, real pipeline">
              These 42 reports are synthetic and live in this browser. Category, summary, duplicate
              candidates, priority factors and hotspot scores are computed by rules-v1, not stored by
              hand. Action briefs are template recommendations; no work order is dispatched.{' '}
              <Link
                to="/report"
                className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-600"
              >
                Submit a report
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </HonestyNote>
          </>
        )}
      </Container>

      <ActionBriefModal cluster={briefCluster} onClose={() => setBriefCluster(null)} />
    </>
  );
}
