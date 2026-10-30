import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Copy,
  ImageOff,
  MapPin,
  SearchX,
} from 'lucide-react';
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
import AiSummaryCard from '@/components/analysis/AiSummaryCard';
import DuplicateList from '@/components/analysis/DuplicateList';
import HotspotMembershipCard from '@/components/analysis/HotspotMembershipCard';
import PriorityFactors from '@/components/analysis/PriorityFactors';
import { useClusters } from '@/hooks/useClusters';
import { useReport } from '@/hooks/useReport';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/useToast';
import { CATEGORY_MAP } from '@/lib/constants';
import { copyText } from '@/lib/clipboard';
import { formatDateTime } from '@/lib/format';

export default function AnalysisDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { push } = useToast();
  const { report, events, loading } = useReport(id);
  const { data: reports } = useReports();
  const { clusters } = useClusters();
  const [copied, setCopied] = useState(false);

  const shortId = id ? `${id.slice(0, 8)}…` : 'missing';
  const justSubmitted = Boolean(location.state?.justSubmitted);
  const category = report ? CATEGORY_MAP[report.category] ?? CATEGORY_MAP.other : null;
  const ai = report?.ai ?? null;

  const reportsById = useMemo(
    () => Object.fromEntries(reports.map((item) => [item.id, item])),
    [reports],
  );

  const liveCluster = useMemo(() => {
    if (!report) return null;
    return clusters.find((cluster) => cluster.members.some((member) => member.id === report.id)) ?? null;
  }, [clusters, report]);

  async function handleCopy() {
    const ok = await copyText(report.referenceCode);
    if (ok) {
      setCopied(true);
      push({
        tone: 'success',
        title: 'Tracking code copied',
        message: report.referenceCode,
      });
    } else {
      push({
        tone: 'danger',
        title: 'Could not copy',
        message: 'Select the code and copy it manually.',
      });
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader
          eyebrow="Understand · one report"
          title="Analysis detail"
          description="The explainability view: original text, summary, category confidence, duplicate evidence and priority arithmetic."
          actions={
            <Link to="/analysis" className="btn btn-ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All analyses
            </Link>
          }
        />
        <Container className="py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <Card padded>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-5" lines={6} />
            </Card>
            <div className="space-y-4">
              <Card padded>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-5" lines={5} />
              </Card>
              <Card padded>
                <Skeleton className="h-24 w-full" />
              </Card>
            </div>
          </div>
        </Container>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <PageHeader
          eyebrow="Understand · one report"
          title="Analysis detail"
          description="The explainability view for a single report."
          actions={
            <Link to="/analysis" className="btn btn-ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All analyses
            </Link>
          }
        >
          <p className="mt-3">
            <Badge tone="neutral">id {shortId}</Badge>
          </p>
        </PageHeader>

        <Container className="py-8 sm:py-10">
          <EmptyState
            icon={SearchX}
            title="No report found for that id"
            description="The report may have been removed by a demo reset, or the link may be incomplete. Open the dashboard to pick a seeded report, or submit a new one."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/dashboard" className="btn btn-primary">
                  Open dashboard
                </Link>
                <Link to="/report" className="btn btn-ghost">
                  Report an issue
                </Link>
              </div>
            }
          />
          <HonestyNote className="mt-6" title="Analysis is stored with the report">
            This page never generates analysis on the fly. If the report does not exist in the
            repository, there is no analysis to explain.
          </HonestyNote>
        </Container>
      </>
    );
  }

  const mapReports = liveCluster?.members?.length ? liveCluster.members : [report];
  const mapClusters = liveCluster ? [liveCluster] : [];

  return (
    <>
      <PageHeader
        eyebrow={category ? `Understand · ${category.label}` : 'Understand · one report'}
        title={report.title ?? `Report ${report.referenceCode}`}
        description="What the rules-v1 pipeline inferred from this report, with every number traceable to a stored input."
        actions={
          <>
            <Link to={`/track/${report.referenceCode}`} className="btn btn-ghost">
              Public timeline
            </Link>
            <Link to="/admin" className="btn btn-ghost">
              Open in admin
            </Link>
            <Link to="/analysis" className="btn btn-ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All analyses
            </Link>
          </>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{report.referenceCode}</Badge>
          <StatusBadge status={report.status} />
          <PriorityBadge band={report.priorityBand} score={report.priorityScore} />
          {ai ? (
            <Badge tone="teal" dot>
              {ai.version} · deterministic · {ai.processingMs} ms
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      <Container className="py-8 sm:py-10">
        {justSubmitted ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-teal-200 bg-teal-50">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-navy-900">Report submitted</p>
                  <p className="mt-0.5 text-sm leading-6 text-slate-600">
                    Keep this tracking code. It is the only thing needed to follow the public
                    timeline on any device.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <code className="rounded-lg border border-teal-200 bg-white px-3 py-1.5 font-mono text-sm font-semibold tracking-widest text-navy-900">
                      {report.referenceCode}
                    </code>
                    <Button size="sm" variant="ghost" onClick={handleCopy}>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </div>
              <Link to={`/track/${report.referenceCode}`} className="btn btn-accent shrink-0">
                Track this report
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="space-y-6">
            <Card padded>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">Original report</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Submitted {formatDateTime(report.createdAt)}
                  </p>
                </div>
                <Badge tone="neutral">
                  {CATEGORY_MAP[report.category]?.label ?? report.category}
                </Badge>
              </div>

              {report.title ? (
                <h3 className="mt-4 text-lg font-semibold text-navy-900">{report.title}</h3>
              ) : null}
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                {report.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {report.locationLabel ?? 'Pinned on the map'}
                </span>
                <span className="tabular-nums">
                  {Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}
                </span>
              </div>

              {report.imageUrl ? (
                <>
                  <img
                    src={report.imageUrl}
                    alt="Citizen-submitted evidence"
                    className="mt-4 w-full rounded-xl border border-slate-200 object-cover"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Photo evidence only. Image content is never analysed by rules-v1.
                  </p>
                </>
              ) : (
                <p className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-xs text-slate-500">
                  <ImageOff className="h-4 w-4" aria-hidden="true" />
                  No photo attached. Images are evidence only and are never analysed.
                </p>
              )}

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {liveCluster ? 'Location and hotspot' : 'Location'}
                </p>
                <div className="mt-2">
                  <ReportMap
                    reports={mapReports}
                    clusters={mapClusters}
                    height={220}
                    showLegend={false}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {liveCluster
                    ? `The dashed circle is the ${liveCluster.label} hotspot (${liveCluster.count} reports, ${liveCluster.radiusMeters} m radius).`
                    : 'One pin for this report. Hotspot circles appear once at least three related reports share the grid cell.'}
                </p>
              </div>
            </Card>

            <AiSummaryCard report={report} ai={ai} />

            <DuplicateList report={report} ai={ai} reportsById={reportsById} />
          </div>

          <div className="space-y-6">
            <PriorityFactors
              priority={ai?.priority}
              band={report.priorityBand}
              score={report.priorityScore}
            />

            <HotspotMembershipCard snapshot={ai?.cluster} cluster={liveCluster} />

            <Card padded>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <ClipboardList className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Pipeline record
              </h2>
              <p className="mt-2 font-mono text-xs font-semibold text-teal-700">
                {ai ? `${ai.version} · deterministic · ${ai.processingMs} ms` : 'no stored analysis'}
              </p>
              <dl className="mt-3 divide-y divide-slate-100">
                <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <dt className="text-slate-500">Version</dt>
                  <dd className="font-mono text-xs font-semibold text-navy-900">
                    {ai?.version ?? '—'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <dt className="text-slate-500">Execution</dt>
                  <dd className="text-right text-navy-900">Deterministic · browser-side</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <dt className="text-slate-500">Processed</dt>
                  <dd className="text-right text-navy-900">
                    {ai ? formatDateTime(ai.processedAt) : '—'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <dt className="text-slate-500">Processing time</dt>
                  <dd className="tabular-nums font-semibold text-navy-900">
                    {ai ? `${ai.processingMs} ms` : '—'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <dt className="text-slate-500">Public updates</dt>
                  <dd className="tabular-nums font-semibold text-navy-900">{events.length}</dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                  to={`/track/${report.referenceCode}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-600"
                >
                  Public timeline
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-900"
                >
                  Operator queue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {ai ? (
                <details className="mt-4 rounded-xl border border-slate-200">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-600">
                    Raw analysis payload
                  </summary>
                  <pre className="max-h-72 overflow-auto border-t border-slate-100 bg-slate-50 p-3 text-[10px] leading-5 text-slate-600">
                    {JSON.stringify(ai, null, 2)}
                  </pre>
                </details>
              ) : null}
            </Card>
          </div>
        </div>

        <HonestyNote className="mt-6" title="Generated from text, not a language model">
          The summary is extractive: it reuses the citizen&apos;s own sentences. Classification,
          duplicates, priority and hotspots are deterministic rules, measured against the labelled
          seed set. No image content is analysed.
        </HonestyNote>
      </Container>
    </>
  );
}
