import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  ClipboardList,
  Copy,
  Gauge,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import HonestyNote from '@/components/ui/HonestyNote';
import Skeleton from '@/components/ui/Skeleton';
import PriorityBadge from '@/components/reports/PriorityBadge';
import { useReports } from '@/hooks/useReports';
import { useClusters } from '@/hooks/useClusters';
import { useDuplicatePairs } from '@/hooks/useDuplicatePairs';
import { CATEGORY_MAP } from '@/lib/constants';
import { formatNumber, formatPercent, timeAgo } from '@/lib/format';

const MODEL_FACTS = [
  ['Version', 'rules-v1'],
  ['Execution', 'Deterministic, browser-side, offline'],
  ['Classification', 'Weighted keyword lexicon'],
  ['Summary', 'Extractive sentence ranking'],
  ['Duplicates', 'TF-IDF cosine + distance + time'],
  ['Priority', 'Additive factors, bands at 80 / 60 / 40'],
  ['Clusters', '0.003° grid · 30 days · min 3'],
  ['Limitations', 'English-first, no image AI, no LLM'],
];

function StageRow({ index, icon: Icon, title, copy, value }) {
  return (
    <li className="flex gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            {index + 1}. {title}
          </p>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-teal-700">{value}</span>
        </div>
        <p className="mt-0.5 text-sm leading-6 text-slate-600">{copy}</p>
      </div>
    </li>
  );
}

export default function Analysis() {
  const { data: reports, loading, error, reload } = useReports();
  const { clusters, loading: clustersLoading } = useClusters();
  const { pairs, loading: pairsLoading } = useDuplicatePairs();

  const analysed = reports.filter((report) => report.ai);
  const lowConfidence = analysed.filter((report) => report.ai.lowConfidence);
  const pendingPairs = pairs.filter((pair) => pair.status === 'pending');
  const recent = [...analysed]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);
  const avgMs = analysed.length
    ? Math.round(analysed.reduce((sum, report) => sum + (report.ai.processingMs ?? 0), 0) / analysed.length)
    : 0;

  const busy = loading || clustersLoading || pairsLoading;

  const stages = [
    {
      icon: ClipboardList,
      title: 'Normalise',
      copy: 'Lowercase, strip punctuation, remove stopwords, split sentences.',
      value: `${formatNumber(analysed.length)} analysed`,
    },
    {
      icon: Brain,
      title: 'Classify',
      copy: 'Weighted keyword lexicon across 7 categories, with confidence and alternatives.',
      value: `${formatNumber(analysed.length)} classified`,
    },
    {
      icon: Copy,
      title: 'Deduplicate',
      copy: 'TF-IDF cosine plus 300 m and 21 days; review at 0.62, strong at 0.82.',
      value: `${formatNumber(pendingPairs.length)} to review`,
    },
    {
      icon: Gauge,
      title: 'Prioritise',
      copy: 'Five additive factors plus the critical-hazard floor, with a reason for every point.',
      value: `${formatNumber(analysed.length)} scored`,
    },
    {
      icon: Layers,
      title: 'Cluster',
      copy: '0.003° grid, 30-day window, minimum 3 reports, hotspot score and trend.',
      value: `${formatNumber(clusters.length)} hotspot${clusters.length === 1 ? '' : 's'}`,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Understand"
        title="AI analysis"
        description="Every number on this page comes from a stored, versioned analysis — never a hand-written claim."
        actions={
          <Link to="/dashboard" className="btn btn-ghost">
            Open dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="teal" dot>
            rules-v1
          </Badge>
          <Badge tone="neutral">Deterministic · offline</Badge>
          <Badge tone="neutral">{formatNumber(reports.length)} reports in the corpus</Badge>
        </div>
      </PageHeader>

      <Container className="py-8 sm:py-10">
        {error ? (
          <Card className="card-pad">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-navy-900">The analysis index could not be loaded.</p>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Reports analysed', formatNumber(analysed.length)],
                ['Avg processing', busy ? '—' : `${avgMs} ms`],
                ['Low confidence', formatNumber(lowConfidence.length)],
                ['Hotspots found', formatNumber(clusters.length)],
              ].map(([label, value]) => (
                <Card key={label} className="card-pad">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                  {busy ? (
                    <Skeleton className="mt-3 h-7 w-14" />
                  ) : (
                    <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900">{value}</p>
                  )}
                </Card>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-6">
                <Card padded>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">Pipeline</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Five deterministic stages run over the same stored report. Counts below are
                        live, not illustrative.
                      </p>
                    </div>
                    <Badge tone="teal" dot>
                      {busy ? 'Running over seed' : 'Seed analysed'}
                    </Badge>
                  </div>

                  <ol className="mt-5 space-y-2.5">
                    {stages.map((stage, index) => (
                      <StageRow
                        key={stage.title}
                        index={index}
                        icon={stage.icon}
                        title={stage.title}
                        copy={stage.copy}
                        value={busy ? '…' : stage.value}
                      />
                    ))}
                  </ol>

                  <p className="mt-5 text-xs leading-5 text-slate-500">
                    The pipeline runs in your browser when a report is submitted and once at seed
                    time. Nothing is sent to a model provider.
                  </p>
                </Card>

                <Card className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
                    <div>
                      <h2 className="text-base font-semibold">Latest analyses</h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Newest reports first. Every row opens the full explainability view.
                      </p>
                    </div>
                    <Badge tone="neutral">{formatNumber(analysed.length)} stored</Badge>
                  </div>

                  {busy ? (
                    <div className="p-5">
                      <Skeleton lines={8} />
                    </div>
                  ) : recent.length === 0 ? (
                    <p className="p-5 text-sm text-slate-600">
                      No analysed reports yet. Reset the demo data from the footer to restore the
                      seed.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {recent.map((report) => (
                        <li key={report.id}>
                          <Link
                            to={`/analysis/${report.id}`}
                            className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-navy-50/60 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-navy-900">
                                {report.title ?? report.referenceCode}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {report.referenceCode} ·{' '}
                                {CATEGORY_MAP[report.category]?.short ?? report.category} ·{' '}
                                {formatPercent(report.ai.confidence, 0)} confidence ·{' '}
                                {timeAgo(report.createdAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {report.ai.lowConfidence ? (
                                <Badge tone="warning">Check category</Badge>
                              ) : null}
                              <PriorityBadge
                                band={report.priorityBand}
                                score={report.priorityScore}
                              />
                              <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                <Card padded>
                  <h2 className="text-lg font-semibold">Model card</h2>
                  <p className="mt-1.5 font-mono text-xs font-semibold text-teal-700">
                    rules-v1 · deterministic · {busy ? '—' : `${avgMs} ms avg`}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    What the analysis is, and what it deliberately is not.
                  </p>

                  <dl className="mt-4 divide-y divide-slate-100">
                    {MODEL_FACTS.map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </dt>
                        <dd className="text-right text-sm text-navy-900">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <HonestyNote className="mt-4" title="No accuracy claims">
                    The prototype does not publish precision or accuracy percentages. Quality is
                    measured against the labelled seed set and recorded in the README.
                  </HonestyNote>
                </Card>

                <Card padded>
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
                    Needs a human look
                  </h2>
                  {busy ? (
                    <Skeleton className="mt-4" lines={3} />
                  ) : lowConfidence.length === 0 ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      No report is below the 45% confidence threshold.
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Classification confidence is below 45%. An operator confirms the category
                        before dispatch.
                      </p>
                      <ul className="mt-3 space-y-2">
                        {lowConfidence.slice(0, 4).map((report) => (
                          <li key={report.id}>
                            <Link
                              to={`/analysis/${report.id}`}
                              className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm hover:bg-amber-50"
                            >
                              <span className="truncate font-mono text-xs font-semibold text-navy-900">
                                {report.referenceCode}
                              </span>
                              <span className="shrink-0 text-xs text-slate-600">
                                {CATEGORY_MAP[report.category]?.short ?? report.category} ·{' '}
                                {formatPercent(report.ai.confidence, 0)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Card>

                <Card padded className="bg-navy-900 text-white">
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <MapPin className="h-4 w-4 text-teal-400" aria-hidden="true" />
                    Hotspots are a separate pass
                  </p>
                  <p className="mt-2 text-sm leading-6 text-navy-100/80">
                    Duplicate reports never create a hotspot. They are attached to the cluster that
                    already contains their parent, so a merge cannot invent a pattern.
                  </p>
                  <Link
                    to="/dashboard"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-400 hover:text-teal-200"
                  >
                    See the hotspot map
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Card>
              </div>
            </div>

            <HonestyNote className="mt-6" title="Real pipeline, synthetic corpus">
              All five stages are inspectable JavaScript running over the actual stored text and
              coordinates. The 42 reports are synthetic demo data, and the action briefs are
              template-generated recommendations — no work order is dispatched.
            </HonestyNote>
          </>
        )}
      </Container>
    </>
  );
}
