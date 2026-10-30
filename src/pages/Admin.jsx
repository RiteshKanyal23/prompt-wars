import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Copy,
  Inbox,
  Map,
  MapPin,
  Table2,
  Users,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import HonestyNote from '@/components/ui/HonestyNote';
import Skeleton from '@/components/ui/Skeleton';
import AdminQueue from '@/components/admin/AdminQueue';
import AdminReportsTab from '@/components/admin/AdminReportsTab';
import DuplicateReview from '@/components/admin/DuplicateReview';
import AdminReportDrawer from '@/components/admin/AdminReportDrawer';
import ReportMap from '@/components/map/ReportMap';
import HotspotCard from '@/components/dashboard/HotspotCard';
import ActionBriefModal from '@/components/dashboard/ActionBriefModal';
import { useReports } from '@/hooks/useReports';
import { useClusters } from '@/hooks/useClusters';
import { useDuplicatePairs } from '@/hooks/useDuplicatePairs';
import { useDataMode } from '@/app/providers';
import { OPEN_STATUSES } from '@/lib/constants';
import { formatNumber } from '@/lib/format';

const TABS = [
  { key: 'queue', label: 'Queue', icon: Inbox },
  { key: 'duplicates', label: 'Duplicates', icon: Copy },
  { key: 'hotspots', label: 'Hotspots', icon: Map },
  { key: 'reports', label: 'Reports', icon: Table2 },
];

const TAB_COPY = {
  queue: 'Highest priority first. Assign, transition and resolve with a public trail.',
  duplicates: 'The pipeline proposes; a human confirms. Confirm merges both timelines, reject keeps both open.',
  hotspots: 'Grid clusters with at least three reports in 30 days, plus template action briefs.',
  reports: 'Search the full corpus and export the filtered set as a formula-safe CSV.',
};

function KpiCard({ label, value, loading, hint }) {
  return (
    <Card className="card-pad">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-12" />
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900">{value}</p>
      )}
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{hint}</p>
    </Card>
  );
}

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab');
  const tab = TABS.some((item) => item.key === rawTab) ? rawTab : 'queue';

  const { data: reports, loading, error, reload } = useReports();
  const { clusters, loading: clustersLoading } = useClusters();
  const { pairs, loading: pairsLoading, review } = useDuplicatePairs();
  const { isLocal } = useDataMode();

  const [selected, setSelected] = useState(null);
  const [briefCluster, setBriefCluster] = useState(null);

  const openReports = reports.filter((report) => OPEN_STATUSES.includes(report.status));
  const urgentOpen = openReports.filter(
    (report) => report.priorityBand === 'P0' || report.priorityBand === 'P1',
  );
  const unassigned = openReports.filter((report) => !report.assignedTo);
  const pendingPairs = pairs.filter((pair) => pair.status === 'pending');
  const reviewedPairs = pairs.filter((pair) => pair.status !== 'pending');

  function selectTab(key) {
    const next = new URLSearchParams(params);
    if (key === 'queue') next.delete('tab');
    else next.set('tab', key);
    setParams(next, { replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Act</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Operator queue</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Triage by priority, confirm or reject duplicate proposals, assign a department and move
            a report through its lifecycle with a citizen-visible trail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isLocal ? 'info' : 'teal'} dot>
            {isLocal ? 'Local demo data' : 'Supabase mode'}
          </Badge>
          <Badge tone="warning" dot>
            Unauthenticated demo
          </Badge>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Admin sections">
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(item.key)}
              className={[
                'inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors',
                active
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : 'border-slate-300 bg-white text-navy-900 hover:bg-navy-50',
              ].join(' ')}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
              {item.key === 'duplicates' && pendingPairs.length > 0 ? (
                <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-navy-900">
                  {pendingPairs.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">{TAB_COPY[tab]}</p>

      {error ? (
        <Card className="card-pad mt-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
              <div>
                <p className="font-semibold text-navy-900">The operator queue could not load.</p>
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
          {tab === 'queue' ? (
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard
                  label="Open reports"
                  value={formatNumber(openReports.length)}
                  loading={loading}
                  hint="Received to in progress"
                />
                <KpiCard
                  label="P0 + P1 open"
                  value={formatNumber(urgentOpen.length)}
                  loading={loading}
                  hint="Critical and high bands"
                />
                <KpiCard
                  label="Unassigned"
                  value={formatNumber(unassigned.length)}
                  loading={loading}
                  hint="No owner recorded"
                />
                <KpiCard
                  label="Duplicate proposals"
                  value={formatNumber(pendingPairs.length)}
                  loading={pairsLoading}
                  hint="Waiting for a human"
                />
              </div>

              <AdminQueue reports={reports} loading={loading} onSelect={setSelected} />
            </div>
          ) : null}

          {tab === 'duplicates' ? (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Copy className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  Duplicate review
                </h2>
                <Badge tone={pendingPairs.length > 0 ? 'warning' : 'success'} dot>
                  {pendingPairs.length} pending
                </Badge>
              </div>

              {pairsLoading ? (
                <Card padded>
                  <Skeleton lines={8} />
                </Card>
              ) : pendingPairs.length === 0 ? (
                <EmptyState
                  icon={Copy}
                  title="No duplicate proposals waiting"
                  description="The pipeline has not proposed a match above the review threshold, or an operator has already reviewed every pair."
                />
              ) : (
                <div className="space-y-4">
                  {pendingPairs.map((pair) => (
                    <DuplicateReview
                      key={pair.id}
                      pair={pair}
                      reports={reports}
                      onReview={review}
                    />
                  ))}
                </div>
              )}

              {reviewedPairs.length > 0 ? (
                <details className="card overflow-hidden">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-semibold text-navy-900">
                      Reviewed decisions ({reviewedPairs.length})
                    </span>
                    <span className="text-xs text-slate-500">Open to audit</span>
                  </summary>
                  <div className="space-y-4 border-t border-slate-200 bg-slate-50/60 p-4">
                    {reviewedPairs.map((pair) => (
                      <DuplicateReview
                        key={pair.id}
                        pair={pair}
                        reports={reports}
                        onReview={review}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}

          {tab === 'hotspots' ? (
            <div className="mt-5 space-y-5">
              <Card padded>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                      <MapPin className="h-4 w-4 text-teal-600" aria-hidden="true" />
                      Hotspot map
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Pins follow the whole corpus; dashed circles are the two seeded hotspots.
                    </p>
                  </div>
                  <Badge tone="teal">{clusters.length} hotspots</Badge>
                </div>
                <div className="mt-4">
                  {loading || clustersLoading ? (
                    <Skeleton className="h-[320px] w-full" />
                  ) : (
                    <ReportMap reports={reports} clusters={clusters} height={320} />
                  )}
                </div>
              </Card>

              {clustersLoading ? (
                <Card padded>
                  <Skeleton lines={6} />
                </Card>
              ) : clusters.length === 0 ? (
                <EmptyState
                  icon={Map}
                  title="No hotspot yet"
                  description="A hotspot needs at least three reports in the same 0.003° grid cell within 30 days."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {clusters.map((cluster) => (
                    <HotspotCard key={cluster.id} cluster={cluster} onBrief={setBriefCluster} />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === 'reports' ? (
            <div className="mt-5">
              <AdminReportsTab reports={reports} loading={loading} onSelect={setSelected} />
            </div>
          ) : null}

          <HonestyNote className="mt-5" title="Real state, mocked dispatch">
            Status changes, assignment and duplicate decisions are real local state and appear on{' '}
            <Link to="/track" className="font-semibold text-teal-700 hover:text-teal-600">
              /track
            </Link>
            . Notifications, crews and SLAs are mocked; no message or work order leaves this browser.
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <Link to="/dashboard" className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-600">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                See the citizen-facing dashboard
              </Link>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </span>
          </HonestyNote>
        </>
      )}

      {selected ? (
        <AdminReportDrawer key={selected.id} report={selected} onClose={() => setSelected(null)} />
      ) : null}

      <ActionBriefModal cluster={briefCluster} onClose={() => setBriefCluster(null)} />
    </div>
  );
}
